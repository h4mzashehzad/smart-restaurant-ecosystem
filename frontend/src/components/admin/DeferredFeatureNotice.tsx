import { Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeferredFeatureNoticeProps {
  title?: string;
  description?: string;
  /** Section heading from ADMIN_DASHBOARD_TODOS.md for operators/devs. */
  todoSection?: string;
  className?: string;
}

/**
 * Non-interactive notice for deferred advanced features.
 * Never present as a working control.
 */
export function DeferredFeatureNotice({
  title = 'Advanced feature deferred',
  description = 'This capability is intentionally not in the MVP. See frontend/src/app/admin/ADMIN_DASHBOARD_TODOS.md for detailed implementation steps and the completion checklist.',
  todoSection,
  className,
}: DeferredFeatureNoticeProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 px-6 py-12 text-center',
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
        <Hammer className="h-7 w-7 text-orange-500" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-gray-500">{description}</p>
      {todoSection ? (
        <p className="mt-3 text-xs font-medium text-orange-600/90">
          TODO checklist: {todoSection}
        </p>
      ) : null}
    </div>
  );
}
