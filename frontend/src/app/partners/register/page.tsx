import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { RestaurantRegistrationWizard } from '@/components/partners/RestaurantRegistrationWizard';
import '@/styles/marketing.css';
import '@/styles/registration.css';
export const metadata: Metadata = {
  title: 'Register your restaurant — Table.com.pk',
  description:
    'Create your restaurant workspace, verify your email and start setting up your menu, tables and team.',
  robots: { index: false, follow: true },
};
export default function RegisterRestaurantPage() {
  return (
    <div className="marketing">
      <MarketingHeader />
      <main>
        <RestaurantRegistrationWizard />
      </main>
    </div>
  );
}
