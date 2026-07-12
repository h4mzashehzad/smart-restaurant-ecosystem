'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.replace('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'staff')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 animate-dot-bounce-0 rounded-full bg-orange-400" />
          <div className="h-2.5 w-2.5 animate-dot-bounce-1 rounded-full bg-orange-400" />
          <div className="h-2.5 w-2.5 animate-dot-bounce-2 rounded-full bg-orange-400" />
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
