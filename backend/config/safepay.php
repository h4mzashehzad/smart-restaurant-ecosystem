<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Safepay API Credentials
    |--------------------------------------------------------------------------
    |
    | Your Safepay merchant API key (public key) and secret key.
    | Set as environment variables - never commit in plain text.
    |
    */

    'api_key'    => env('SAFEPAY_API_KEY'),
    'secret_key' => env('SAFEPAY_SECRET_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Safepay Base URL
    |--------------------------------------------------------------------------
    | Sandbox:    https://sandbox.api.getsafepay.com
    | Production: https://api.getsafepay.com
    */

    'base_url'    => env('SAFEPAY_BASE_URL', 'https://sandbox.api.getsafepay.com'),
    'environment' => env('SAFEPAY_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Secret
    |--------------------------------------------------------------------------
    | Shared secret from Safepay Dashboard (Developer -> Endpoints).
    | Used to verify HMAC-SHA256 signatures on incoming webhooks.
    */

    'webhook_secret' => env('SAFEPAY_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | Checkout URL
    |--------------------------------------------------------------------------
    | Hosted checkout page where customers complete payment.
    */

    'checkout_url' => env('SAFEPAY_BASE_URL', 'https://sandbox.api.getsafepay.com') . '/components',

    /*
    |--------------------------------------------------------------------------
    | Split-Bill Payment Timeout
    |--------------------------------------------------------------------------
    | Minutes participants have to complete payment before the atomic
    | split group is voided and rolled back.
    */

    'split_payment_timeout_minutes' => env('SAFEPAY_SPLIT_TIMEOUT_MINUTES', 10),

];