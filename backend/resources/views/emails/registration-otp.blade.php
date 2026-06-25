<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirm Your Registration</title>
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
            background-color: #ffedd5;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #ea580c;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 24px;
            color: #4b5563;
        }
        .otp-box {
            background-color: #f9fafb;
            border: 2px dashed #ea580c;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #ea580c;
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
            <h1>Smart Restaurant</h1>
        </div>
        <div class="content">
            <p>Hi {{ $name }},</p>
            <p>Thank you for registering with Smart Restaurant! To complete your account creation, please enter the following 6-digit confirmation code:</p>
            
            <div class="otp-box">
                <p class="otp-code">{{ $otp }}</p>
            </div>
            
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this code, please safely ignore this email.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Smart Restaurant Ecosystem. All rights reserved.
        </div>
    </div>
</body>
</html>
