<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Payment Receipt - {{ $payment->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            background: #fff;
            padding: 32px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #f97316;
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .restaurant-name {
            font-size: 22px;
            font-weight: bold;
            color: #f97316;
            letter-spacing: 1px;
        }
        .receipt-title {
            font-size: 13px;
            color: #6b7280;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .meta-grid {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .meta-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .meta-label {
            font-size: 10px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
        }
        .meta-value {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
        }
        .section-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-bottom: 10px;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.items th {
            font-size: 10px;
            text-transform: uppercase;
            color: #9ca3af;
            text-align: left;
            padding: 6px 4px;
            border-bottom: 1px solid #e5e7eb;
        }
        table.items th.right { text-align: right; }
        table.items td {
            padding: 8px 4px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        table.items td.right { text-align: right; }
        table.items td.item-name { font-weight: 600; }
        table.items td.item-note {
            font-size: 10px;
            color: #9ca3af;
        }
        .totals {
            width: 100%;
            margin-bottom: 20px;
        }
        .totals-row {
            display: table;
            width: 100%;
            padding: 4px 0;
        }
        .totals-label {
            display: table-cell;
            color: #6b7280;
        }
        .totals-value {
            display: table-cell;
            text-align: right;
            font-weight: 600;
        }
        .totals-grand {
            border-top: 2px solid #f97316;
            margin-top: 8px;
            padding-top: 8px;
        }
        .totals-grand .totals-label {
            font-size: 14px;
            font-weight: bold;
            color: #111827;
        }
        .totals-grand .totals-value {
            font-size: 16px;
            font-weight: bold;
            color: #f97316;
        }
        .payment-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .badge-safepay {
            background: #eff6ff;
            color: #1d4ed8;
        }
        .badge-cash {
            background: #f0fdf4;
            color: #15803d;
        }
        .footer {
            margin-top: 24px;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 16px;
        }
        .split-section {
            background: #fefce8;
            border: 1px solid #fde68a;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
        }
        .split-label {
            font-size: 10px;
            color: #92400e;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>

{{-- Header --}}
<div class="header">
    <div class="restaurant-name">
        {{ $order?->restaurant?->name ?? config('app.name') }}
    </div>
    <div class="receipt-title">Payment Receipt</div>
</div>

{{-- Meta info --}}
<div class="meta-grid" style="margin-bottom:20px;">
    <div class="meta-col">
        <div class="meta-label">Receipt #</div>
        <div class="meta-value">PAY-{{ str_pad($payment->id, 6, '0', STR_PAD_LEFT) }}</div>
    </div>
    <div class="meta-col" style="text-align:right;">
        <div class="meta-label">Date</div>
        <div class="meta-value">{{ ($payment->paid_at ?? now())->format('d M Y, h:i A') }}</div>
    </div>
</div>

<div class="meta-grid" style="margin-bottom:20px;">
    <div class="meta-col">
        @if($order)
        <div class="meta-label">Order #</div>
        <div class="meta-value">{{ $order->order_number }}</div>
        @endif
    </div>
    <div class="meta-col" style="text-align:right;">
        @if($session?->table)
        <div class="meta-label">Table</div>
        <div class="meta-value">{{ $session->table->table_number }}</div>
        @endif
    </div>
</div>

{{-- Items --}}
@if($order && $order->items->count())
<div class="section-title">Order Items</div>
<table class="items">
    <thead>
        <tr>
            <th>Item</th>
            <th class="right">Qty</th>
            <th class="right">Price</th>
            <th class="right">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($order->items as $item)
        <tr>
            <td class="item-name">{{ $item->menuItem?->name ?? 'Item' }}</td>
            <td class="right">{{ $item->quantity }}</td>
            <td class="right">Rs {{ number_format($item->unit_price, 0) }}</td>
            <td class="right">Rs {{ number_format($item->total_price, 0) }}</td>
        </tr>
        @if($item->customization_notes)
        <tr>
            <td class="item-note" colspan="4">↳ {{ $item->customization_notes }}</td>
        </tr>
        @endif
        @endforeach
    </tbody>
</table>
@endif

{{-- Split bill indicator --}}
@if($payment->payment_type !== 'full')
<div class="split-section">
    <div class="split-label">Split Bill
        @if($payment->payment_type === 'split_equal') (Equal Split)
        @elseif($payment->payment_type === 'split_itemized') (By Items)
        @endif
    </div>
    <div>Your share of this bill: <strong>Rs {{ number_format($payment->amount, 0) }}</strong></div>
</div>
@endif

{{-- Totals --}}
<div class="totals">
    @if($order)
    <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span class="totals-value">Rs {{ number_format($order->subtotal, 0) }}</span>
    </div>
    @if($order->tax_amount > 0)
    <div class="totals-row">
        <span class="totals-label">Tax</span>
        <span class="totals-value">Rs {{ number_format($order->tax_amount, 0) }}</span>
    </div>
    @endif
    @if($order->discount_amount > 0)
    <div class="totals-row">
        <span class="totals-label">Discount</span>
        <span class="totals-value">- Rs {{ number_format($order->discount_amount, 0) }}</span>
    </div>
    @endif
    @endif
    <div class="totals-row totals-grand">
        <span class="totals-label">
            @if($payment->payment_type !== 'full') Your Amount Paid @else Total Paid @endif
        </span>
        <span class="totals-value">Rs {{ number_format($payment->amount, 0) }}</span>
    </div>
</div>

{{-- Payment method --}}
<div style="margin-bottom: 20px;">
    <div class="meta-label" style="margin-bottom: 6px;">Payment Method</div>
    @if($payment->payment_method === 'safepay')
        <span class="payment-badge badge-safepay">Safepay</span>
        @if($payment->safepay_reference_code)
        <div style="margin-top:6px; font-size:10px; color:#6b7280;">
            Ref: {{ $payment->safepay_reference_code }}
        </div>
        @endif
    @else
        <span class="payment-badge badge-cash">Cash</span>
    @endif

    @if($payment->transaction_id)
    <div style="margin-top:6px; font-size:10px; color:#6b7280;">
        Transaction ID: {{ $payment->transaction_id }}
    </div>
    @endif
</div>

{{-- Footer --}}
<div class="footer">
    <p>Thank you for dining with us!</p>
    <p style="margin-top:4px;">{{ config('app.name') }} &bull; Generated {{ now()->format('d M Y H:i') }}</p>
</div>

</body>
</html>