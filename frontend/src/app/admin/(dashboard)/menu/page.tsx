import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import MenuContainer from './MenuContainer';

export const metadata: Metadata = {
  title: 'Menu — Admin',
};

export default function AdminMenuPage() {
  return (
    <RequireAdmin>
      <MenuContainer />
    </RequireAdmin>
  );
}
