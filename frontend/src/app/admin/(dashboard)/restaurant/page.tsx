import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import RestaurantContainer from './RestaurantContainer';

export const metadata: Metadata = {
  title: 'Restaurant Details — Admin',
};

export default function AdminRestaurantPage() {
  return (
    <RequireAdmin>
      <RestaurantContainer />
    </RequireAdmin>
  );
}
