'use client';

import { useState } from 'react';
import { Menu, LogOut, ChevronDown, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAdminOnboarding } from './onboarding/AdminOnboardingProvider';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const onboarding = useAdminOnboarding();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const role = (user?.role === 'admin' ? 'admin' : 'staff') as 'admin' | 'staff';
  const restaurantName = user?.restaurant?.name ?? 'Your Restaurant';

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <AdminSidebar role={role} />
      </aside>

      {/* ── Mobile sidebar (Sheet) ──────────────────────────────────── */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-gray-100 px-4 py-4">
            <SheetTitle className="font-display">Menu</SheetTitle>
          </SheetHeader>
          <AdminSidebar role={role} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                <Store className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold font-display text-gray-900 leading-tight">
                  {restaurantName}
                </p>
                <p className="text-[11px] font-medium text-gray-400 leading-tight">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-gray-200 bg-white px-1.5 py-1 pr-2.5 text-sm transition-colors hover:bg-gray-50'
                  )}
                />
              }
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline max-w-[120px] truncate font-medium text-gray-700">
                {user?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
                  <span className="text-sm font-semibold text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                  <span className="mt-0.5 inline-flex w-fit rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                    {role}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onboarding?.start()}>Restart dashboard tour</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main data-tour-content className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
