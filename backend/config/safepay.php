<?php

return [
    'api_key' => env('SAFEPAY_API_KEY'),
    'secret_key' => env('SAFEPAY_SECRET_KEY'),
    'webhook_secret' => env('SAFEPAY_WEBHOOK_SECRET'),
    'environment' => env('SAFEPAY_ENVIRONMENT', 'sandbox'),
    'base_url' => env('SAFEPAY_BASE_URL', 'https://sandbox.api.getsafepay.com'),
    'intent' => env('SAFEPAY_INTENT', 'CYBERSOURCE'),
    'currency' => env('SAFEPAY_CURRENCY', 'PKR'),
    'success_url' => env('SAFEPAY_SUCCESS_URL', env('FRONTEND_URL', 'http://localhost:3000').'/payment/callback'),
    'cancel_url' => env('SAFEPAY_CANCEL_URL', env('FRONTEND_URL', 'http://localhost:3000').'/payment/callback?cancelled=1'),
    'split_timeout_minutes' => (int) env('SAFEPAY_SPLIT_TIMEOUT_MINUTES', 10),
];
