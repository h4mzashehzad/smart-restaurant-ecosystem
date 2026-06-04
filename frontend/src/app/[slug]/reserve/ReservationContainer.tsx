'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  address: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  tables: TableInfo[];
}

interface TableInfo {
  id: number;
  table_number: string;
  capacity: number;
  is_available?: boolean;
  reason?: string | null;
}

interface TimeSlot {
  time: string;
  label: string;
  disabled: boolean;
}

type Step = 'date' | 'time' | 'table' | 'info' | 'success';
const STEPS: Step[] = ['date', 'time', 'table', 'info', 'success'];
const STEP_LABELS: Record<Step, string> = {
  date: 'Date & Guests',
  time: 'Time',
  table: 'Table',
  info: 'Your Info',
  success: 'Done',
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function friendlyDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ReservationContainer({ slug }: { slug: string }) {
  const router = useRouter();

  // Restaurant data
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [partySize, setPartySize] = useState(2);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Load restaurant info
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRestaurantBySlug(slug);
        setRestaurant(data);
      } catch {
        setError('Restaurant not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Load time slots when date changes
  useEffect(() => {
    if (!restaurant || !selectedDate) return;
    (async () => {
      try {
        const slots = await api.getTimeSlots(restaurant.id, selectedDate);
        setTimeSlots(slots);
        setSelectedTime('');
      } catch {
        setTimeSlots([]);
      }
    })();
  }, [restaurant, selectedDate]);

  // Load table availability when time or date changes
  useEffect(() => {
    if (!restaurant || !selectedDate || !selectedTime) return;
    (async () => {
      try {
        const data = await api.getTableAvailability(restaurant.id, selectedDate, selectedTime, partySize);
        setTables(data);
        setSelectedTable(null);
      } catch {
        setTables([]);
      }
    })();
  }, [restaurant, selectedDate, selectedTime, partySize]);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!restaurant || !selectedTable) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createReservation({
        restaurant_id: restaurant.id,
        table_id: selectedTable,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        party_size: partySize,
        reservation_date: selectedDate,
        reservation_time: selectedTime,
        special_requests: specialRequests.trim() || undefined,
      });
      setConfirmationCode(result.data.confirmation_code);
      setStep('success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : 'Failed to create reservation.';
      setError(typeof msg === 'string' ? msg : 'Failed to create reservation.');
    } finally {
      setSubmitting(false);
    }
  }, [restaurant, selectedTable, guestName, guestPhone, guestEmail, partySize, selectedDate, selectedTime, specialRequests]);

  /* ── Validation ──────────────────────────────────────────────────────── */

  const canProceedDate = !!selectedDate && partySize >= 1;
  const canProceedTime = !!selectedTime;
  const canProceedTable = selectedTable !== null;
  const canProceedInfo = guestName.trim().length >= 2 && guestPhone.trim().length >= 7;

  /* ── Calendar helpers ────────────────────────────────────────────────── */

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  function getCalendarDays() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: Date; inMonth: boolean }> = [];
    // Padding for days before the first
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, -firstDay + i + 1);
      days.push({ date: d, inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), inMonth: true });
    }
    // Padding for the last row
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - daysInMonth - firstDay + 1);
      days.push({ date: d, inMonth: false });
    }
    return days;
  }

  function isDaySelectable(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= maxDate;
  }

  /* ── Render ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-zinc-900 mb-2">Restaurant Not Found</h1>
          <p className="text-zinc-500 mb-6">The restaurant you're looking for doesn't exist or isn't available.</p>
          <button onClick={() => router.push('/')} className="px-6 py-2.5 rounded-2xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans selection:bg-orange-500 selection:text-white">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <MapPinIcon className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <h1 className="font-display text-xl font-bold text-zinc-900 truncate">{restaurant.name}</h1>
          </div>
          <p className="text-sm text-zinc-500 pl-8">{restaurant.address}</p>
        </div>
      </header>

      {/* ── Progress Bar ────────────────────────────────────────────────── */}
      {step !== 'success' && (
        <div className="bg-white border-b border-zinc-100">
          <div className="max-w-2xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2">
              {STEPS.filter(s => s !== 'success').map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    i < stepIndex ? 'text-orange-500' : i === stepIndex ? 'text-zinc-900' : 'text-zinc-300'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      i < stepIndex ? 'bg-orange-500 text-white' : i === stepIndex ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${i < stepIndex ? 'bg-orange-500' : 'bg-zinc-100'}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && step !== 'success' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ═══ Step 1: Date & Party Size ═══ */}
        {step === 'date' && (
          <div className="animate-fade-in-up space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Pick a Date</h2>
              <p className="text-sm text-zinc-500">Reservations can be made up to 30 days in advance.</p>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="p-2 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-500 disabled:opacity-30"
                  disabled={calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear()}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h3 className="font-display font-bold text-zinc-900">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="p-2 rounded-xl hover:bg-zinc-50 transition-colors text-zinc-500 disabled:opacity-30"
                  disabled={calendarMonth.getMonth() === maxDate.getMonth() && calendarMonth.getFullYear() === maxDate.getFullYear()}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-zinc-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map(({ date, inMonth }, i) => {
                  const dateStr = formatDate(date);
                  const isSelected = dateStr === selectedDate;
                  const selectable = inMonth && isDaySelectable(date);
                  const isToday = dateStr === formatDate(today);

                  return (
                    <button
                      key={i}
                      onClick={() => selectable && setSelectedDate(dateStr)}
                      disabled={!selectable}
                      className={`h-10 rounded-xl text-sm font-medium transition-all ${
                        !inMonth ? 'text-zinc-200 cursor-default' :
                        isSelected ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' :
                        isToday ? 'bg-orange-50 text-orange-600 font-bold' :
                        selectable ? 'text-zinc-700 hover:bg-zinc-50' :
                        'text-zinc-300 cursor-not-allowed'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Party Size */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <UserGroupIcon className="w-5 h-5 text-orange-500" />
                <h3 className="font-display font-bold text-zinc-900">Number of Guests</h3>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setPartySize(Math.max(1, partySize - 1))}
                  className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 font-bold text-xl hover:bg-zinc-200 transition-colors disabled:opacity-30"
                  disabled={partySize <= 1}
                >
                  −
                </button>
                <div className="text-center">
                  <span className="font-display text-4xl font-bold text-zinc-900">{partySize}</span>
                  <p className="text-xs text-zinc-400 mt-0.5">{partySize === 1 ? 'guest' : 'guests'}</p>
                </div>
                <button
                  onClick={() => setPartySize(Math.min(20, partySize + 1))}
                  className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 font-bold text-xl hover:bg-zinc-200 transition-colors disabled:opacity-30"
                  disabled={partySize >= 20}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={!canProceedDate}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Choose Time
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ═══ Step 2: Time Slot ═══ */}
        {step === 'time' && (
          <div className="animate-fade-in-up space-y-8">
            <div>
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Choose a Time</h2>
              <p className="text-sm text-zinc-500">
                {friendlyDate(selectedDate)} · {partySize} {partySize === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-5 h-5 text-orange-500" />
                <h3 className="font-display font-bold text-zinc-900">Available Slots</h3>
              </div>

              {timeSlots.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">No time slots available for this date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => !slot.disabled && setSelectedTime(slot.time)}
                      disabled={slot.disabled}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                        slot.disabled ? 'bg-zinc-50 text-zinc-300 cursor-not-allowed' :
                        selectedTime === slot.time ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' :
                        'bg-zinc-50 text-zinc-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={goNext}
              disabled={!canProceedTime}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Select Table
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ═══ Step 3: Table Selection ═══ */}
        {step === 'table' && (
          <div className="animate-fade-in-up space-y-8">
            <div>
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Select a Table</h2>
              <p className="text-sm text-zinc-500">
                {friendlyDate(selectedDate)} · {timeSlots.find(s => s.time === selectedTime)?.label} · {partySize} {partySize === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map((table) => {
                const isSelected = selectedTable === table.id;
                const available = table.is_available;

                return (
                  <button
                    key={table.id}
                    onClick={() => available && setSelectedTable(table.id)}
                    disabled={!available}
                    className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                      !available
                        ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-white border-zinc-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`font-display text-2xl font-bold ${isSelected ? 'text-white' : !available ? 'text-zinc-300' : 'text-zinc-900'}`}>
                      #{table.table_number}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-2 text-sm font-medium ${
                      isSelected ? 'text-white/80' : !available ? 'text-zinc-300' : 'text-zinc-500'
                    }`}>
                      <UserGroupIcon className="w-4 h-4" />
                      {table.capacity} seats
                    </div>
                    {!available && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                        {table.reason === 'reserved' ? 'Reserved' : table.reason === 'occupied' ? 'Occupied' : 'Too Small'}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircleIcon className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {tables.length === 0 && (
              <p className="text-sm text-zinc-400 text-center py-6">No tables available for this time slot.</p>
            )}

            <button
              onClick={goNext}
              disabled={!canProceedTable}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Enter Your Details
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ═══ Step 4: Guest Info ═══ */}
        {step === 'info' && (
          <div className="animate-fade-in-up space-y-8">
            <div>
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-4">
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>
              <h2 className="font-display text-2xl font-bold text-zinc-900 mb-1">Your Details</h2>
              <p className="text-sm text-zinc-500">
                {friendlyDate(selectedDate)} · {timeSlots.find(s => s.time === selectedTime)?.label} · Table #{tables.find(t => t.id === selectedTable)?.table_number} · {partySize} {partySize === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="bg-white rounded-2xl border border-zinc-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden">
                <div className="flex items-center gap-3 px-4">
                  <UserIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full py-4 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white rounded-2xl border border-zinc-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden">
                <div className="flex items-center gap-3 px-4">
                  <PhoneIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full py-4 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-2xl border border-zinc-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden">
                <div className="flex items-center gap-3 px-4">
                  <EnvelopeIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full py-4 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Special Requests */}
              <div className="bg-white rounded-2xl border border-zinc-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all overflow-hidden">
                <div className="flex items-start gap-3 px-4 pt-4">
                  <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <textarea
                    placeholder="Special Requests (optional)"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-medium resize-none pb-4"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canProceedInfo || submitting}
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold text-lg transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reserving...
                </>
              ) : (
                <>
                  Confirm Reservation
                  <CheckCircleIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ═══ Step 5: Success ═══ */}
        {step === 'success' && (
          <div className="animate-fade-in-up text-center py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="font-display text-3xl font-bold text-zinc-900 mb-2">Reservation Confirmed!</h2>
            <p className="text-zinc-500 mb-8">Your table has been reserved. Please save your confirmation code.</p>

            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm mb-8 max-w-sm mx-auto">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Confirmation Code</p>
              <p className="font-mono text-3xl font-bold text-orange-500 tracking-widest mb-6">{confirmationCode}</p>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDaysIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-600">{friendlyDate(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ClockIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-600">{timeSlots.find(s => s.time === selectedTime)?.label || selectedTime}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPinIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-600">Table #{tables.find(t => t.id === selectedTable)?.table_number}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserGroupIcon className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-600">{partySize} {partySize === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="px-8 py-3.5 rounded-2xl bg-zinc-900 text-white font-semibold transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              Done
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
