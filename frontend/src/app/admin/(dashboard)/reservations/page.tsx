import type { Metadata } from 'next';
import ReservationsContainer from './ReservationsContainer';

export const metadata: Metadata = {
  title: 'Reservations — Admin',
};

export default function AdminReservationsPage() {
  return <ReservationsContainer />;
}
