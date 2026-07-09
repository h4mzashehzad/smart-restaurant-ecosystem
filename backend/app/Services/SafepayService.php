<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class SafepayService
{
    protected Client $client;
    protected string $apiKey;
    protected string $secretKey;
    protected string $baseUrl;
    protected string $webhookSecret;

    public function __construct()
    {
        $this->apiKey        = config('safepay.api_key');
        $this->secretKey     = config('safepay.secret_key');
        $this->baseUrl       = rtrim(config('safepay.base_url'), '/');
        $this->webhookSecret = config('safepay.webhook_secret');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout'  => 15,
            'headers'  => [
                'Accept'       => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    /**
     * Create a Safepay payment tracker.
     *
     * POST /order/v1/init
     *
     * @param  int|float  $amount    Amount in PKR (full rupees, not paisa)
     * @param  string     $currency  e.g. 'PKR'
     * @param  string     $orderId   Your internal order/payment reference (stored in metadata)
     * @return array{token: string, ...}  Safepay tracker payload
     *
     * @throws \RuntimeException
     */
    public function createTracker(float $amount, string $currency = 'PKR', string $orderId = ''): array
    {
        try {
            $response = $this->client->post('/order/v1/init', [
                'json' => [
                    'merchant_api_key' => $this->apiKey,
                    'intent'           => 'CYBERSOURCE',
                    'mode'             => 'payment',
                    'currency'         => $currency,
                    'amount'           => (int) round($amount * 100), // Safepay expects paisa (subunit)
                    'metadata'         => [
                        'order_id'   => $orderId,
                        'source'     => 'smart-restaurant',
                    ],
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            if (empty($data['data']['token'])) {
                Log::error('Safepay createTracker: unexpected response', ['data' => $data]);
                throw new \RuntimeException('Safepay did not return a tracker token.');
            }

            return $data['data'];
        } catch (GuzzleException $e) {
            Log::error('Safepay createTracker HTTP error', ['error' => $e->getMessage()]);
            throw new \RuntimeException('Failed to create Safepay payment tracker: ' . $e->getMessage());
        }
    }

    /**
     * Build the hosted checkout redirect URL for a given tracker token.
     *
     * @param  string  $trackerToken   The token returned by createTracker()
     * @param  string  $redirectUrl    Where Safepay sends the customer after checkout
     * @param  string  $cancelUrl      Where Safepay sends the customer if they cancel
     * @return string  Full Safepay checkout URL
     */
    public function generateCheckoutUrl(string $trackerToken, string $redirectUrl, string $cancelUrl = ''): string
    {
        $params = http_build_query(array_filter([
            'env'        => config('safepay.environment'),
            'beacon'     => $trackerToken,
            'redirect_url' => $redirectUrl,
            'cancel_url'   => $cancelUrl ?: $redirectUrl,
            'source'     => 'order',
        ]));

        return config('safepay.checkout_url') . '?' . $params;
    }

    /**
     * Fetch the current status of a payment tracker.
     *
     * GET /order/v1/tracker/{token}
     *
     * @param  string  $trackerToken
     * @return array   Tracker data including state
     *
     * @throws \RuntimeException
     */
    public function fetchTrackerStatus(string $trackerToken): array
    {
        try {
            $response = $this->client->get("/order/v1/tracker/{$trackerToken}", [
                'headers' => [
                    'X-SFPY-MERCHANT-SECRET' => $this->secretKey,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['data'] ?? [];
        } catch (GuzzleException $e) {
            Log::error('Safepay fetchTrackerStatus HTTP error', [
                'token' => $trackerToken,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to fetch Safepay tracker status: ' . $e->getMessage());
        }
    }

    /**
     * Verify a Safepay webhook HMAC-SHA256 signature.
     *
     * Safepay computes: HMAC-SHA256(webhookSecret, rawPayload)
     * and sends it in the X-SFPY-SIGNATURE header.
     *
     * @param  string  $rawPayload   Raw request body (do NOT json_decode before this)
     * @param  string  $signature    Value from X-SFPY-SIGNATURE header
     * @return bool
     */
    public function verifyWebhookSignature(string $rawPayload, string $signature): bool
    {
        $expected = hash_hmac('sha256', $rawPayload, $this->webhookSecret);
        return hash_equals($expected, $signature);
    }

    /**
     * Initiate a refund for a completed payment.
     *
     * POST /order/v1/refund
     * Used for atomic split-bill rollback when one participant fails.
     *
     * @param  string     $trackerToken
     * @param  float|null $amount  Partial refund amount (null = full refund)
     * @return array
     *
     * @throws \RuntimeException
     */
    public function refundPayment(string $trackerToken, ?float $amount = null): array
    {
        try {
            $payload = ['token' => $trackerToken];
            if ($amount !== null) {
                $payload['amount'] = (int) round($amount * 100); // paisa
            }

            $response = $this->client->post('/order/v1/refund', [
                'headers' => [
                    'X-SFPY-MERCHANT-SECRET' => $this->secretKey,
                ],
                'json' => $payload,
            ]);

            return json_decode($response->getBody()->getContents(), true) ?? [];
        } catch (GuzzleException $e) {
            Log::error('Safepay refundPayment HTTP error', [
                'token' => $trackerToken,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to refund Safepay payment: ' . $e->getMessage());
        }
    }

    /**
     * Check whether a Safepay tracker state indicates a successful payment.
     *
     * @param  array  $trackerData  Data from fetchTrackerStatus()
     * @return bool
     */
    public function isPaymentSuccessful(array $trackerData): bool
    {
        // Safepay uses 'PAID' as the success state
        $state = strtoupper($trackerData['state'] ?? $trackerData['status'] ?? '');
        return in_array($state, ['PAID', 'COMPLETED', 'SUCCESSFUL'], true);
    }
}