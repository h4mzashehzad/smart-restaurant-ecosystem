import { AdminOnboardingProvider } from '@/components/admin/onboarding/AdminOnboardingProvider';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminOnboardingProvider>{children}</AdminOnboardingProvider>;
}
