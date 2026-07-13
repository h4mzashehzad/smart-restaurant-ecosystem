import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import CategoriesContainer from './CategoriesContainer';

export const metadata: Metadata = {
  title: 'Categories — Admin',
};

export default function AdminCategoriesPage() {
  return (
    <RequireAdmin>
      <CategoriesContainer />
    </RequireAdmin>
  );
}
