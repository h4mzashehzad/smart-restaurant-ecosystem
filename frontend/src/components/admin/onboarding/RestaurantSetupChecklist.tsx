'use client';
import Link from 'next/link';
import { Check, ArrowRight, Compass } from 'lucide-react';
import { useAdminOnboarding } from './AdminOnboardingProvider';
import { useAuth } from '@/contexts/AuthContext';
export function RestaurantSetupChecklist() {
  const context = useAdminOnboarding();
  const { user } = useAuth();
  if (!context || user?.role !== 'admin') return null;
  if (context.error && !context.data)
    return (
      <div role="alert" className="rounded-xl border border-orange-200 bg-white p-4 text-sm">
        {context.error}{' '}
        <button onClick={context.retry} className="font-semibold text-orange-800 underline">
          Retry
        </button>
      </div>
    );
  const setup = context.data?.setup;
  if (!setup) return null;
  const items = [
    {
      label: 'Complete restaurant details & hours',
      done: setup.profile,
      href: '/admin/restaurant',
    },
    { label: 'Create your first category', done: setup.categories, href: '/admin/categories' },
    { label: 'Add your first dish', done: setup.menu, href: '/admin/menu' },
    { label: 'Add a table & get its QR code', done: setup.tables, href: '/admin/tables' },
    { label: 'Add your team (optional)', done: setup.team, href: '/admin/team' },
  ];
  const completed = items.slice(0, 4).filter((item) => item.done).length;
  if (completed === 4 && !context.data?.tour) return null;
  return (
    <section className="rounded-2xl border border-orange-200 bg-white p-5 sm:p-6" data-tour-setup>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-800">Make yourself at home</p>
          <h2 className="font-display mt-1 text-xl font-semibold text-gray-900">
            {completed === 4 ? 'Your restaurant is set up.' : 'Get ready for your first service.'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-gray-600">
            {completed === 4
              ? 'You can revisit the tour whenever you need it.'
              : 'Add your own details, dishes and tables. Your dashboard and forecasts will fill in as your restaurant receives orders.'}
          </p>
        </div>
        <button
          type="button"
          onClick={context.start}
          disabled={context.busy}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 text-xs font-semibold text-orange-900 disabled:opacity-50"
        >
          <Compass size={16} /> Take a tour
        </button>
      </div>
      <p className="mt-5 mb-3 text-xs font-medium text-gray-500">
        {completed} of 4 essentials complete
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-700 hover:border-orange-300 focus-visible:outline-2 focus-visible:outline-orange-700"
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${item.done ? 'border-emerald-700 bg-emerald-50 text-emerald-700' : 'border-gray-300'}`}
            >
              {item.done ? <Check size={12} aria-label="Complete" /> : null}
            </span>
            <span>{item.label}</span>
            <ArrowRight size={14} className="ml-auto shrink-0 text-gray-400" />
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <Link
          href={`/menu?restaurant_id=${setup.restaurant_id}`}
          className="min-h-8 text-orange-800 underline underline-offset-4"
        >
          Preview your menu
        </Link>
        {setup.profile && setup.tables ? (
          <Link
            href={`/${setup.slug}/reserve`}
            className="min-h-8 text-orange-800 underline underline-offset-4"
          >
            Your reservation page
          </Link>
        ) : (
          <span className="text-gray-500">
            Add opening hours and tables to prepare your reservation page.
          </span>
        )}
      </div>
    </section>
  );
}
