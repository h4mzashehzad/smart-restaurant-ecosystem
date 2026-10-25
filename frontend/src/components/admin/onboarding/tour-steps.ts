import { ADMIN_NAV_GROUPS, KDS_NAV_ITEM } from '../nav-config';
const descriptions: Record<string, string> = {
  '/admin':
    'Your daily orders, revenue, guest activity and items needing attention are collected here. New restaurants start at zero; figures grow with your own activity.',
  '/admin/restaurant':
    'Keep your address, contact details and opening hours up to date. These details support your guest reservation experience.',
  '/admin/menu':
    'Add dishes, prices, descriptions and photos. Set availability, link customization ingredients, and attach a 3D model URL for supported dishes.',
  '/admin/categories':
    'Organize your dishes into clear menu categories. Create your first category before adding a dish.',
  '/admin/ingredients':
    'Manage ingredients, costs, stock levels and allergen information. Dish-specific customization rules are configured when editing a menu item.',
  '/admin/tables':
    'Create tables with seating capacities, get their QR codes, and manage live dining sessions. Each QR opens the correct restaurant and table.',
  '/admin/team':
    'Create administrator and staff accounts for your restaurant. Role-based access gives staff the operational tools they need.',
  '/admin/orders':
    'Find your restaurant’s orders, inspect dishes and totals, and follow their current status.',
  '/admin/kds':
    'Your live kitchen board brings together orders, customization notes, service requests, reservation preorders and cash-payment alerts.',
  '/admin/reservations':
    'Manage bookings and guest arrivals. Review food preorders and their scheduled kitchen release, with cancellation handling where applicable.',
  '/admin/queue':
    'Use the host stand to manage walk-ins, call waiting parties and mark them seated.',
  '/admin/waiter-requests':
    'See table assistance requests, acknowledge them and resolve them so guests know their request is being handled.',
  '/admin/payments':
    'Review payment history and pending cash payments. Confirm cash after it is received; card checkout is handled through the configured Safepay gateway.',
  '/admin/reviews':
    'Read guest feedback, review sentiment flags and record responses to understand where service can improve.',
  '/admin/loyalty':
    'Find your restaurant’s returning guests and inspect loyalty activity associated with their visits.',
  '/admin/analytics':
    'Explore revenue, peak hours, menu performance, sentiment, loyalty and fulfillment. Forecasts need enough order history; empty charts are expected when starting out.',
};
const order = [
  '/admin',
  '/admin/restaurant',
  '/admin/menu',
  '/admin/categories',
  '/admin/ingredients',
  '/admin/tables',
  '/admin/team',
  '/admin/orders',
  '/admin/kds',
  '/admin/reservations',
  '/admin/queue',
  '/admin/waiter-requests',
  '/admin/payments',
  '/admin/reviews',
  '/admin/loyalty',
  '/admin/analytics',
];
const navigation = [KDS_NAV_ITEM, ...ADMIN_NAV_GROUPS.flatMap((group) => group.items)];
export const tourSteps = order.map((href) => {
  const item = navigation.find((item) => item.href === href)!;
  return { ...item, description: descriptions[href] };
});
