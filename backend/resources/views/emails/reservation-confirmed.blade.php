<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reservation Confirmed</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
            color: #1f2937;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1px solid #f3f4f6;
        }
        .header {
            background-color: #d1fae5;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #059669;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
        }
        .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 24px;
            color: #4b5563;
        }
        .details-box {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            border: 1px solid #f3f4f6;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            width: 120px;
        }
        .detail-value {
            color: #111827;
            font-weight: 500;
        }
        .code-box {
            text-align: center;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px dashed #e5e7eb;
        }
        .code-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #9ca3af;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .confirmation-code {
            font-size: 32px;
            font-weight: 700;
            color: #ea580c;
            letter-spacing: 4px;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reservation Confirmed</h1>
        </div>
        <div class="content">
            <p>Hi {{ $reservation->guest_name }},</p>
            <p>Your table reservation at <strong>{{ $reservation->restaurant->name }}</strong> has been confirmed! We look forward to hosting you. Here are your reservation details:</p>
            
            <div class="details-box">
                <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">{{ \Carbon\Carbon::parse($reservation->reservation_date)->format('l, M j, Y') }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Time:</div>
                    <div class="detail-value">{{ \Carbon\Carbon::parse($reservation->reservation_time)->format('g:i A') }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Guests:</div>
                    <div class="detail-value">{{ $reservation->party_size }} {{ $reservation->party_size == 1 ? 'Guest' : 'Guests' }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Table:</div>
                    <div class="detail-value">#{{ $reservation->table->table_number }}</div>
                </div>
                @if($reservation->special_requests)
                <div class="detail-row" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <div class="detail-label">Requests:</div>
                    <div class="detail-value">{{ $reservation->special_requests }}</div>
                </div>
                @endif
                
                <div class="code-box">
                    <div class="code-label">Confirmation Code</div>
                    <p class="confirmation-code">{{ $reservation->confirmation_code }}</p>
                </div>
            </div>
            
            <p>If you need to make changes to your reservation, please contact us directly.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Smart Restaurant Ecosystem. All rights reserved.
        </div>
    </div>
</body>
</html>
