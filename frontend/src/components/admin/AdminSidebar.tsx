'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { KDS_NAV_ITEM, visibleNavGroups } from './nav-config';

interface AdminSidebarProps {
  role: 'admin' | 'staff';
  onNavigate?: () => void;
  className?: string;
}

function isActiveHref(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ role, onNavigate, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const groups = visibleNavGroups(role);
  const kdsActive = isActiveHref(pathname, KDS_NAV_ITEM.href);

  return (
    <nav className={cn('flex h-full flex-col gap-6 overflow-y-auto px-3 py-5', className)}>
      <Link href={KDS_NAV_ITEM.href} data-tour-link={KDS_NAV_ITEM.href} onClick={onNavigate} className="px-1">
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors',
            kdsActive
              ? 'border-orange-200 bg-orange-50 text-orange-700'
              : 'border-gray-200 bg-gray-900 text-white hover:bg-gray-800'
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              kdsActive ? 'bg-orange-100' : 'bg-orange-500/20'
            )}
          >
            <KDS_NAV_ITEM.icon
              className={cn('h-4.5 w-4.5', kdsActive ? 'text-orange-600' : 'text-orange-400')}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">{KDS_NAV_ITEM.label}</p>
            <p
              className={cn(
                'text-[11px] font-medium leading-tight',
                kdsActive ? 'text-orange-600/70' : 'text-gray-400'
              )}
            >
              Live kitchen view
            </p>
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-6">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {group.label && (
              <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActiveHref(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour-link={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-orange-600' : 'text-gray-400')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
