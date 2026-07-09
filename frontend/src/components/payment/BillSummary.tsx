'use client';

import React from 'react';

interface OrderItem {
  id: number;
  menuItem?: { name: string };
  quantity: number;
  unit_price: number;
  total_price: number;
  customization_notes?: string;
}

interface Order {
  id: number;
  order_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  items: OrderItem[];
}

interface Payment {
  id: number;
  participant_id?: number | null;
  amount: number;
  payment_method: string;
  status: string;
  participant?: {
    user?: { name: string };
    guest_name?: string;
  };
}

interface BillSummaryProps {
  orders: Order[];
  payments: Payment[];
  totalBill: number;
  totalPaid: number;
  remaining: number;
}

export function BillSummary({ orders, payments, totalBill, totalPaid, remaining }: BillSummaryProps) {
  // Aggregate items from all orders
  const allItems = orders.flatMap(order => order.items);
  
  const totalSubtotal = orders.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalTax = orders.reduce((sum, o) => sum + Number(o.tax_amount), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discount_amount), 0);
  
  const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'pending');

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
      <h3 className="font-display font-bold text-gray-900 mb-4 text-lg">Bill Summary</h3>
      
      {/* Items List */}
      <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {allItems.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No items ordered yet.</p>
        ) : (
          allItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  <span className="text-orange-500 mr-2">{item.quantity}x</span>
                  {item.menuItem?.name || 'Item'}
                </p>
                {item.customization_notes && (
                  <p className="text-xs text-gray-400 mt-0.5 ml-6">↳ {item.customization_notes}</p>
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">
                Rs {Number(item.total_price).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>Rs {totalSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
        </div>
        {totalTax > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span>
            <span>Rs {totalTax.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
          </div>
        )}
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Discount</span>
            <span>- Rs {totalDiscount.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
          </div>
        )}
        
        <div className="flex justify-between font-display font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
          <span>Total Bill</span>
          <span>Rs {totalBill.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
        </div>
      </div>

      {/* Payments made so far */}
      {completedPayments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payments</h4>
          <div className="space-y-2 mb-3">
            {completedPayments.map(p => {
              const name = p.participant?.user?.name || p.participant?.guest_name || 'Someone';
              const isPending = p.status === 'pending';
              return (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {name} <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 ml-1">{p.payment_method}</span>
                    {isPending && <span className="text-xs text-orange-500 ml-1">(pending)</span>}
                  </span>
                  <span className="text-gray-900 font-medium">Rs {Number(p.amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between font-display font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Remaining</span>
            <span className="text-orange-500">Rs {remaining.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
