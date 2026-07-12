'use client';

import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from './EmptyState';

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return (
      <EmptyState
        icon={Lock}
        title="Admin access required"
        description="This section is only available to restaurant administrators. Contact your admin if you need access."
      />
    );
  }

  return <>{children}</>;
}
