<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('ml:generate-demand-forecast')->dailyAt('02:00');
Schedule::command('reservations:process-preorders')->everyMinute()->withoutOverlapping();
