<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(array_map('trim', explode(',', env('FRONTEND_URL', 'http://localhost:3000,http://127.0.0.1:3000')))),

    'allowed_origins_patterns' => [
        // Allow any local network IP (192.168.x.x) during development.
        // This covers phones/tablets on the same WiFi hitting the dev server.
        '#^http://192\.168\..+:[0-9]+$#',
        '#^http://10\..+:[0-9]+$#',
        '#^http://172\.(1[6-9]|2[0-9]|3[0-1])\..+:[0-9]+$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
