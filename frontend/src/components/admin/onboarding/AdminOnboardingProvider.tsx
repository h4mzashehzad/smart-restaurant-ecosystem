'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import type { OnboardingData, TourState } from '@/types/onboarding';
import { tourSteps } from './tour-steps';
import { AdminTourCard } from './AdminTourCard';
interface OnboardingContext {
  data?: OnboardingData;
  start: () => void;
  busy: boolean;
  error: string;
  retry: () => void;
}
const Context = createContext<OnboardingContext | null>(null);
export const useAdminOnboarding = () => useContext(Context);
export function AdminOnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const enabled =
    !loading &&
    !!user?.restaurant_id &&
    user.is_active !== false &&
    (user.role === 'admin' || user.role === 'staff') &&
    pathname !== '/admin/login';
  const key = ['admin', 'onboarding', user?.id, user?.restaurant_id];
  const query = useQuery({
    queryKey: key,
    queryFn: async () =>
      (await api.http.get<{ data: OnboardingData }>('/admin/onboarding')).data.data,
    enabled,
  });
  const steps = tourSteps.filter((step) => !step.adminOnly || user?.role === 'admin');
  const tour = query.data?.tour;
  const stepIndex = Math.min(tour?.step ?? 0, steps.length - 1);
  const current = steps[stepIndex];
  const open = enabled && tour && ['pending', 'active'].includes(tour.status);
  useEffect(() => {
    if (enabled) void query.refetch();
    // Refresh the data-driven setup checklist on return from a setup page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, enabled]);
  useEffect(() => {
    if (!open || !current || pathname !== current.href) return;
    let highlighted: HTMLElement | null = null;
    const apply = () => {
      const nav = Array.from(document.querySelectorAll<HTMLElement>('[data-tour-link]')).find(
        (element) =>
          element.dataset.tourLink === current.href && element.getClientRects().length > 0
      );
      const target =
        nav ??
        document.querySelector<HTMLElement>('[data-tour-content] h1') ??
        document.querySelector<HTMLElement>('main h1') ??
        document.querySelector<HTMLElement>('[data-tour-target]');
      if (!target || highlighted === target) return;
      highlighted?.removeAttribute('data-tour-highlight');
      highlighted = target;
      target.setAttribute('data-tour-highlight', 'true');
      target.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', apply);
    return () => {
      observer.disconnect();
      highlighted?.removeAttribute('data-tour-highlight');
      window.removeEventListener('resize', apply);
    };
  }, [open, current, pathname]);
  async function save(state: TourState, destination?: string) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = (await api.http.patch<{ data: TourState }>('/admin/onboarding', state)).data
        .data;
      client.setQueryData<OnboardingData>(key, (old) => (old ? { ...old, tour: result } : old));
      if (destination && pathname !== destination) router.push(destination);
    } catch (err) {
      setError(getErrorMessage(err, 'Your tour progress could not be saved. Please try again.'));
    } finally {
      setBusy(false);
    }
  }
  const start = () => {
    void save({ version: 1, step: 0, status: 'active' }, steps[0].href);
  };
  return (
    <Context.Provider
      value={{
        data: enabled ? query.data : undefined,
        start,
        busy,
        error: error || (query.isError ? 'Could not load your setup progress.' : ''),
        retry: () => {
          void query.refetch();
        },
      }}
    >
      {children}
      {open && current && (
        <AdminTourCard
          step={current}
          index={stepIndex}
          total={steps.length}
          busy={busy}
          error={error}
          onBack={() => {
            const index = Math.max(0, stepIndex - 1);
            void save({ version: 1, step: index, status: 'active' }, steps[index].href);
          }}
          onNext={() => {
            const next = stepIndex + 1;
            void save(
              {
                version: 1,
                step: next === steps.length ? stepIndex : next,
                status: next === steps.length ? 'completed' : 'active',
              },
              next === steps.length ? '/admin' : steps[next].href
            );
          }}
          onSkip={() => {
            void save({ version: 1, step: stepIndex, status: 'skipped' });
          }}
        />
      )}
      {enabled && !open && (
        <button
          type="button"
          onClick={start}
          disabled={busy || !query.data}
          className="fixed right-4 bottom-4 z-30 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 shadow-sm hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700"
        >
          {busy ? 'Opening tour…' : 'Dashboard tour'}
        </button>
      )}
      {enabled && !open && error && (
        <p
          role="alert"
          className="fixed right-4 bottom-18 z-30 max-w-xs rounded-lg border border-red-200 bg-white p-3 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </Context.Provider>
  );
}
