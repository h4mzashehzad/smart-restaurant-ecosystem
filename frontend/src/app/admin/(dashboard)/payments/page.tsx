import type { Metadata } from 'next';
import PaymentsContainer from './PaymentsContainer';

export const metadata: Metadata = {
  title: 'Payments — Admin',
};

export default function AdminPaymentsPage() {
  return <PaymentsContainer />;
}
