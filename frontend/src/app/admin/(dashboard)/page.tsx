import type { Metadata } from 'next';
import DashboardContainer from './DashboardContainer';

export const metadata: Metadata = {
  title: 'Dashboard — Admin',
  description: 'Restaurant operations overview.',
};

export default function AdminDashboardPage() {
  return <DashboardContainer />;
}
