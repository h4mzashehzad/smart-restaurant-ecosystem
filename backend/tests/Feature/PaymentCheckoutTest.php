<?php

use App\Services\SafepayService;
use Illuminate\Support\Facades\Http;

test('safepay service verifies matching hmac signature', function () {
    config(['safepay.webhook_secret' => 'whsec_test']);
    $body = '{"type":"payment.succeeded"}';
    $sig = hash_hmac('sha256', $body, 'whsec_test');

    expect(app(SafepayService::class)->verifyWebhookSignature($body, $sig))->toBeTrue()
        ->and(app(SafepayService::class)->verifyWebhookSignature($body, 'bad'))->toBeFalse();
});

test('safepay service builds checkout url with tracker and passport token', function () {
    config([
        'safepay.base_url' => 'https://sandbox.api.getsafepay.com',
        'safepay.environment' => 'sandbox',
        'safepay.success_url' => 'http://localhost:3000/payment/callback',
        'safepay.cancel_url' => 'http://localhost:3000/payment/callback?cancelled=1',
    ]);

    $url = app(SafepayService::class)->generateCheckoutUrl('track_abc', 'tbt_xyz');

    expect($url)->toContain('tracker=track_abc')
        ->and($url)->toContain('tbt=tbt_xyz')
        ->and($url)->toContain('environment=sandbox')
        ->and($url)->toContain('/embedded?');
});

test('safepay createTracker converts pkr to paisa', function () {
    Http::fake([
        'sandbox.api.getsafepay.com/order/payments/v3/*' => Http::response([
            'data' => ['tracker' => ['token' => 'track_paisa']],
            'status' => ['message' => 'success'],
        ]),
    ]);

    config([
        'safepay.api_key' => 'sec_test',
        'safepay.secret_key' => 'secret_test',
        'safepay.base_url' => 'https://sandbox.api.getsafepay.com',
        'safepay.intent' => 'CYBERSOURCE',
        'safepay.currency' => 'PKR',
    ]);

    $result = app(SafepayService::class)->createTracker(150.50, ['order_id' => 42]);

    expect($result['tracker_token'])->toBe('track_paisa');

    Http::assertSent(function ($request) {
        return $request['amount'] === 15050
            && $request['metadata']['order_id'] === '42';
    });
});

test('safepay isTrackerPaid accepts flat and nested state', function () {
    $service = app(SafepayService::class);

    expect($service->isTrackerPaid(['state' => 'TRACKER_ENDED']))->toBeTrue()
        ->and($service->isTrackerPaid(['tracker' => ['state' => 'TRACKER_ENDED']]))->toBeTrue()
        ->and($service->isTrackerPaid(['state' => 'TRACKER_STARTED']))->toBeFalse();
});

test('webhook without valid signature is rejected', function () {
    config(['safepay.webhook_secret' => 'whsec_test']);

    $this->call(
        'POST',
        '/api/payments/safepay/webhook',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_SFPY_SIGNATURE' => 'invalid',
        ],
        '{"type":"payment.succeeded"}'
    )->assertUnauthorized();
});
