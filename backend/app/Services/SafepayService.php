<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SafepayService
{
    public function createTracker(float $amountPkr, array $metadata = []): array
    {
        $paisa = (int) round($amountPkr * 100);

        // Safepay requires metadata values to be strings (numbers cause 400 unmarshal errors).
        // Only documented keys like order_id are accepted.
        $stringMetadata = collect($metadata)
            ->reject(fn ($value) => $value === null)
            ->map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value))
            ->all();

        $response = $this->client()->post('/order/payments/v3/', [
            'merchant_api_key' => config('safepay.api_key'),
            'intent' => config('safepay.intent'),
            'mode' => 'payment',
            'currency' => config('safepay.currency'),
            'amount' => $paisa,
            'metadata' => $stringMetadata,
        ]);

        if ($response->failed()) {
            Log::error('Safepay createTracker failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new RuntimeException('Failed to create Safepay payment session.');
        }

        $data = $response->json('data');
        $trackerToken = data_get($data, 'tracker.token');

        if (! $trackerToken) {
            throw new RuntimeException('Safepay response missing tracker token.');
        }

        return [
            'tracker_token' => $trackerToken,
            'raw' => $data,
        ];
    }

    public function createPassportToken(): string
    {
        $response = $this->client()->post('/client/passport/v1/token');

        if ($response->failed()) {
            Log::error('Safepay passport token failed', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new RuntimeException('Failed to create Safepay authentication token.');
        }

        $token = $response->json('data');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Safepay passport response missing token.');
        }

        return $token;
    }

    public function generateCheckoutUrl(string $trackerToken, string $passportToken, ?string $successUrl = null, ?string $cancelUrl = null): string
    {
        $query = http_build_query([
            'tracker' => $trackerToken,
            'tbt' => $passportToken,
            'environment' => config('safepay.environment'),
            'source' => 'hosted',
            'redirect_url' => $successUrl ?? config('safepay.success_url'),
            'cancel_url' => $cancelUrl ?? config('safepay.cancel_url'),
        ]);

        return rtrim(config('safepay.base_url'), '/').'/embedded?'.$query;
    }

    public function createCheckoutForAmount(float $amountPkr, array $metadata = []): array
    {
        $tracker = $this->createTracker($amountPkr, $metadata);
        $passport = $this->createPassportToken();
        $checkoutUrl = $this->generateCheckoutUrl($tracker['tracker_token'], $passport);

        return [
            'tracker_token' => $tracker['tracker_token'],
            'checkout_url' => $checkoutUrl,
            'raw' => $tracker['raw'],
        ];
    }

    public function fetchTrackerStatus(string $trackerToken): array
    {
        $response = $this->client()->get('/reporter/api/v1/payments/'.$trackerToken);

        if ($response->failed()) {
            Log::warning('Safepay fetchTrackerStatus failed', [
                'tracker' => $trackerToken,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            throw new RuntimeException('Failed to fetch Safepay tracker status.');
        }

        return $response->json('data') ?? [];
    }

    public function isTrackerPaid(array $trackerData): bool
    {
        // Reporter API returns the tracker object as `data` (flat `state`).
        // Some docs/examples nest it under `data.tracker.state` — support both.
        $state = data_get($trackerData, 'tracker.state')
            ?? data_get($trackerData, 'state');

        return $state === 'TRACKER_ENDED';
    }

    public function verifyWebhookSignature(string $rawBody, ?string $signature): bool
    {
        if (! $signature || ! config('safepay.webhook_secret')) {
            return false;
        }

        $expected = hash_hmac('sha256', $rawBody, config('safepay.webhook_secret'));

        // Safepay may send hex or a prefixed signature; compare both raw and common forms.
        $candidates = [
            $expected,
            'sha256='.$expected,
            hash_hmac('sha512', $rawBody, config('safepay.webhook_secret')),
        ];

        foreach ($candidates as $candidate) {
            if (hash_equals($candidate, $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Official Safepay SDKs authenticate secret-key requests with X-SFPY-MERCHANT-SECRET,
     * not Authorization: Bearer.
     */
    protected function client(): PendingRequest
    {
        return Http::withHeaders([
            'X-SFPY-MERCHANT-SECRET' => config('safepay.secret_key'),
        ])
            ->acceptJson()
            ->asJson()
            ->baseUrl(rtrim(config('safepay.base_url'), '/'));
    }
}
