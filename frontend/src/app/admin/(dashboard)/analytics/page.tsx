import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import AnalyticsContainer from './AnalyticsContainer';

export const metadata: Metadata = {
  title: 'Analytics — Admin',
};

export default function AdminAnalyticsPage() {
  return (
    <RequireAdmin>
      <AnalyticsContainer />
    </RequireAdmin>
  );
}
