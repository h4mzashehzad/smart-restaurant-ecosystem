<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $payment->transaction_id }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 6px 4px; border-bottom: 1px solid #ddd; }
        .totals td { border-bottom: none; }
        .right { text-align: right; }
    </style>
</head>
<body>
    <h1>{{ $restaurant->name ?? 'Smart Restaurant' }}</h1>
    @if($restaurant)
        <p class="muted">{{ $restaurant->address ?? '' }}</p>
    @endif

    <p>
        <strong>Order:</strong> {{ $order->order_number ?? 'N/A' }}<br>
        <strong>Date:</strong> {{ optional($payment->paid_at ?? $payment->created_at)->format('Y-m-d H:i') }}<br>
        <strong>Payment:</strong> {{ strtoupper($payment->payment_method) }} ({{ $payment->payment_type }})<br>
        <strong>Transaction:</strong> {{ $payment->transaction_id }}
        @if($payment->safepay_reference_code)
            <br><strong>Reference:</strong> {{ $payment->safepay_reference_code }}
        @endif
    </p>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @if($payment->splitBillItems->isNotEmpty())
                @foreach($payment->splitBillItems as $claim)
                    <tr>
                        <td>{{ $claim->orderItem?->menuItem?->name ?? 'Item' }}</td>
                        <td>1</td>
                        <td class="right">Rs {{ number_format((float) $claim->amount, 2) }}</td>
                    </tr>
                @endforeach
            @elseif($order)
                @foreach($order->items as $item)
                    <tr>
                        <td>{{ $item->item_name ?? $item->menuItem?->name ?? 'Item' }} @if($item->customization_notes)<br><small>{{ $item->customization_notes }}</small>@endif</td>
                        <td>{{ $item->quantity }}</td>
                        <td class="right">Rs {{ number_format((float) $item->total_price, 2) }}</td>
                    </tr>
                @endforeach
            @endif
            <tr class="totals">
                <td colspan="2"><strong>Amount Paid</strong></td>
                <td class="right"><strong>Rs {{ number_format((float) $payment->amount, 2) }}</strong></td>
            </tr>
        </tbody>
    </table>
</body>
</html>
