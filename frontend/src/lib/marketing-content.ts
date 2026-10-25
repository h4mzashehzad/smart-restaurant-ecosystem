export const productScreens = {
  menu: {
    file: 'menu-recommendations.PNG',
    width: 1290,
    height: 2510,
    alt: 'The real guest menu with popular dishes, descriptions, ratings and prices',
  },
  session: {
    file: 'table-session.PNG',
    width: 1290,
    height: 2350,
    alt: 'A guest joined to Table 3 with a shared dining session and cart',
  },
  ingredients: {
    file: 'ingredient-picker.PNG',
    width: 1290,
    height: 2124,
    alt: 'Dish ingredient quantities and customization before adding to the cart',
  },
  ar: {
    file: 'ar-dish-preview.PNG',
    width: 1290,
    height: 2350,
    alt: 'A cheesecake model in the actual 3D and AR dish viewer',
  },
  payment: {
    file: 'payment-options.PNG',
    width: 1290,
    height: 1258,
    alt: 'Table checkout with equal or itemized splitting, cash and card payment',
  },
  claims: {
    file: 'payment-item-claims.PNG',
    width: 1290,
    height: 1809,
    alt: 'Guests claiming individual dishes for their share of the bill',
  },
  tracker: {
    file: 'payment-tracker.PNG',
    width: 1290,
    height: 1427,
    alt: 'Live payment progress showing paid and pending participants',
  },
  reservations: {
    file: 'table-reservation.png',
    width: 657,
    height: 853,
    alt: 'Online reservation with table selection and seat capacities',
  },
  service: {
    file: 'waiter-assistance.PNG',
    width: 1290,
    height: 1656,
    alt: 'Guest service requests for a waiter, water, cutlery, a bill or an issue',
  },
  feedback: {
    file: 'customer-feedback.PNG',
    width: 1290,
    height: 1690,
    alt: 'Overall dining feedback and ratings for individual dishes',
  },
  loyalty: {
    file: 'loyalty-dashboard.PNG',
    width: 1290,
    height: 1623,
    alt: 'Customer loyalty tier, points, benefits and points history',
  },
  kitchen: {
    file: 'kds-board.png',
    width: 1919,
    height: 909,
    alt: 'Actual kitchen display with example order tickets, table numbers, notes and service actions',
  },
  heatmap: {
    file: 'analytics-heatmap.png',
    width: 1647,
    height: 681,
    alt: 'Restaurant analytics showing the peak-hours heatmap by day and hour',
  },
  forecast: {
    file: 'analytics-forecast.png',
    width: 1646,
    height: 851,
    alt: 'Demand forecasting with hourly predictions and suggested preparation quantities',
  },
} as const;
export type ScreenName = keyof typeof productScreens;

export const featureGroups: {
  id: string;
  title: string;
  description: string;
  features: string[];
  screens: ScreenName[];
  note?: string;
}[] = [
  {
    id: 'arrival',
    title: 'A good service starts before arrival.',
    description:
      'Give guests a clear way to plan their visit, and give your front of house the details they need.',
    features: [
      'Online reservations with dates, time slots, table availability and party sizes',
      'Food preorders with reservations and scheduled kitchen release',
      'Booking confirmations and customer reservation management',
      'Walk-in queue with waiting, called and seated statuses',
    ],
    screens: ['reservations'],
  },
  {
    id: 'ordering',
    title: 'Their table. Their menu. Their pace.',
    description:
      'A table QR opens the guest experience in the browser. Guests can join one session from their own phones.',
    features: [
      'Unique table QR codes and shared table sessions',
      'Guest access without mandatory account creation',
      'Menu categories, dish details, pricing and dietary information',
      'Personalized recommendations with popular-dish fallbacks',
    ],
    screens: ['session', 'menu'],
  },
  {
    id: 'dishes',
    title: 'Let guests make it their own.',
    description:
      'Show what is in a dish, what can change, and what it will cost before it reaches the kitchen.',
    features: [
      'Optional ingredients, removals and adjustable quantities',
      'Customization pricing reflected in the cart',
      'Dish photos, dietary information and ingredient details',
      'Interactive 3D previews and AR for dishes with a model',
    ],
    screens: ['ingredients', 'ar'],
    note: 'AR requires a configured dish model and a compatible device/browser. A 3D preview remains available where supported.',
  },
  {
    id: 'service',
    title: 'Keep the whole team in the picture.',
    description: 'One connected service, from a guest’s request to the kitchen ticket.',
    features: [
      'Live kitchen tickets with table numbers, quantities and customization notes',
      'Order preparation and service status updates',
      'Prioritized waiter, water, cutlery and assistance requests',
      'Reservation preorders, feedback alerts and pending cash payments in the kitchen view',
    ],
    screens: ['kitchen', 'service'],
  },
  {
    id: 'payments',
    title: 'A shared meal. A simpler bill.',
    description:
      'Let the table settle together, split equally, or claim individual items. Track each payment as it happens.',
    features: [
      'Full, equal-split and itemized checkout',
      'Live item claims and participant payment progress',
      'Cash with staff confirmation, and card checkout through Safepay',
      'Digital receipts and an administrator payment ledger',
    ],
    screens: ['claims', 'tracker', 'payment'],
  },
  {
    id: 'relationships',
    title: 'Give every visit a next chapter.',
    description: 'Understand guest experiences and make returning feel worthwhile.',
    features: [
      'Overall and per-dish feedback and ratings',
      'Sentiment summaries and flagged negative feedback',
      'Customer points, tier benefits and transaction history',
      'Restaurant customer history and loyalty insights',
    ],
    screens: ['feedback', 'loyalty'],
  },
  {
    id: 'management',
    title: 'Your restaurant, set up your way.',
    description: 'Keep your operation in its own workspace, with your own team, menu and tables.',
    features: [
      'Restaurant details, contact information and opening hours',
      'Separate administrator and staff access',
      'Categories, menu items, image uploads and availability controls',
      'Ingredients, customization rules and low-stock visibility',
      'Tables, capacities, QR codes and session management',
    ],
    screens: [],
    note: 'Each operator belongs to one restaurant. Your team’s management screens and restaurant data stay scoped to that restaurant.',
  },
  {
    id: 'insights',
    title: 'See the patterns behind the shift.',
    description: 'Move from individual tickets to a useful view of how your restaurant is doing.',
    features: [
      'Revenue, popular dishes and menu/category performance',
      'Peak-hour heatmaps, busiest tables and table turnover',
      'Sentiment, loyalty and fulfillment insights',
      'Low-stock ingredient reporting',
      'Hourly demand forecasts and suggested preparation quantities',
    ],
    screens: ['heatmap', 'forecast'],
    note: 'Forecasts need sufficient historical orders and the forecasting service. A new restaurant starts with clear empty states while its history grows.',
  },
];
