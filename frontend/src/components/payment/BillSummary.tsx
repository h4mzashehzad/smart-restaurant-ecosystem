'use client';

interface BillSummaryProps {
  subtotal: number;
  taxAmount: number;
  total: number;
  discount?: number;
  discountPercent?: number;
  className?: string;
}

export function BillSummary({
  subtotal,
  taxAmount,
  total,
  discount = 0,
  discountPercent,
  className = '',
}: BillSummaryProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between text-sm font-sans text-gray-500">
        <span>Subtotal</span>
        <span>Rs {subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-sm font-sans text-emerald-600">
          <span>
            Loyalty discount
            {discountPercent ? ` (−${discountPercent}%)` : ''}
          </span>
          <span>− Rs {discount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-sans text-gray-500">
        <span>Tax (12%)</span>
        <span>Rs {taxAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex justify-between font-display font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
        <span>Total</span>
        <span className="text-orange-500">Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
