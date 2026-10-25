<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RestaurantRegistrationOTP extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $name, public string $otp, public string $restaurantName) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Verify your restaurant — Table.com.pk');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.restaurant-registration-otp');
    }
}
