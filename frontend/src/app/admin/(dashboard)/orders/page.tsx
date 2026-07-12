import type { Metadata } from 'next';
import OrdersContainer from './OrdersContainer';

export const metadata: Metadata = {
  title: 'Orders — Admin',
};

export default function AdminOrdersPage() {
  return <OrdersContainer />;
}
