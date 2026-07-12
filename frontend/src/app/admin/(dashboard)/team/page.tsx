import type { Metadata } from 'next';
import { RequireAdmin } from '@/components/admin/RequireAdmin';
import TeamContainer from './TeamContainer';

export const metadata: Metadata = {
  title: 'Team — Admin',
};

export default function AdminTeamPage() {
  return (
    <RequireAdmin>
      <TeamContainer />
    </RequireAdmin>
  );
}
