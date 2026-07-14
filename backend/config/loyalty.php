<?php

return [
    'tiers' => [
        'bronze' => [
            'min_points' => 0,
            'discount_percent' => 5,
            'min_order_subtotal' => 1000,
        ],
        'silver' => [
            'min_points' => 500,
            'discount_percent' => 10,
            'min_order_subtotal' => 2000,
        ],
        'gold' => [
            'min_points' => 1500,
            'discount_percent' => 15,
            'min_order_subtotal' => 2000,
        ],
    ],
    'rupees_per_point' => 20,
];
