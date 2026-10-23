import { Suspense } from 'react';
import { ReservationManagement } from './ReservationManagement';

export const metadata = { title: 'Manage your reservation', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

export default async function ReservationManagementPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <Suspense fallback={<p className="p-8 text-center text-gray-500">Loading reservation…</p>}><ReservationManagement code={code} /></Suspense>;
}
