import type { LucideIcon } from 'lucide-react';
import {
  ChefHat,
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  CalendarClock,
  Users,
  BellRing,
  CreditCard,
  UtensilsCrossed,
  Layers,
  Carrot,
  Table2,
  Star,
  Building2,
  UsersRound,
  Gift,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Restrict to admin role only. Staff will not see these links. */
  adminOnly?: boolean;
}

export interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

/** Kitchen Display System — rendered outside the grouped nav, top of sidebar. */
export const KDS_NAV_ITEM: AdminNavItem = {
  label: 'Kitchen Display System',
  href: '/admin/kds',
  icon: ChefHat,
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
      { label: 'Reservations', href: '/admin/reservations', icon: CalendarClock },
      { label: 'Queue', href: '/admin/queue', icon: Users },
      { label: 'Waiter Requests', href: '/admin/waiter-requests', icon: BellRing },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Loyalty Program', href: '/admin/loyalty', icon: Gift },
    ],
  },
  {
    label: 'Restaurant',
    items: [
      { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed, adminOnly: true },
      { label: 'Categories', href: '/admin/categories', icon: Layers, adminOnly: true },
      { label: 'Ingredients', href: '/admin/ingredients', icon: Carrot, adminOnly: true },
      { label: 'Tables', href: '/admin/tables', icon: Table2, adminOnly: true },
      { label: 'Reviews', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Restaurant Details', href: '/admin/restaurant', icon: Building2, adminOnly: true },
      { label: 'Team', href: '/admin/team', icon: UsersRound, adminOnly: true },
    ],
  },
];

export function visibleNavGroups(role: 'admin' | 'staff' | undefined): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || role === 'admin'),
  })).filter((group) => group.items.length > 0);
}
