<?php

use App\Services\SplitBillService;

test('equal split remainder goes to the last participant', function () {
    $total = 100.00;
    $count = 3;
    $base = floor(($total / $count) * 100) / 100;
    $amounts = array_fill(0, $count, $base);
    $amounts[$count - 1] = round($total - ($base * ($count - 1)), 2);

    expect(array_sum($amounts))->toBe(100.0)
        ->and($amounts[0])->toBe(33.33)
        ->and($amounts[1])->toBe(33.33)
        ->and($amounts[2])->toBe(33.34);
});

test('paisa conversion multiplies by 100', function () {
    expect((int) round(150.50 * 100))->toBe(15050)
        ->and((int) round(100.00 * 100))->toBe(10000);
});

test('split bill service can be resolved', function () {
    expect(app(SplitBillService::class))->toBeInstanceOf(SplitBillService::class);
});
