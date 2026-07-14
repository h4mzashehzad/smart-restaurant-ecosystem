import type { Metadata } from 'next';
import LoyaltyContainer from './LoyaltyContainer';

export const metadata: Metadata = {
  title: 'Loyalty Program — Admin',
};

export default function AdminLoyaltyPage() {
  return <LoyaltyContainer />;
}
