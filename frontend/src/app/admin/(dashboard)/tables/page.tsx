import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import TablesContainer from './TablesContainer';

export const metadata: Metadata = {
  title: 'Tables — Admin',
};

export default function AdminTablesPage() {
  return (
    <RequireAdmin>
      <TablesContainer />
    </RequireAdmin>
  );
}
