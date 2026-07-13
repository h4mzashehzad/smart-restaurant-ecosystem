import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import IngredientsContainer from './IngredientsContainer';

export const metadata: Metadata = {
  title: 'Ingredients — Admin',
};

export default function AdminIngredientsPage() {
  return (
    <RequireAdmin>
      <IngredientsContainer />
    </RequireAdmin>
  );
}
