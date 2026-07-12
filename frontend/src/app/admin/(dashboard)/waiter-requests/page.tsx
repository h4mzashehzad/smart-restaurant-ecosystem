import type { Metadata } from 'next';
import WaiterRequestsContainer from './WaiterRequestsContainer';

export const metadata: Metadata = {
  title: 'Waiter Requests — Admin',
};

export default function AdminWaiterRequestsPage() {
  return <WaiterRequestsContainer />;
}
