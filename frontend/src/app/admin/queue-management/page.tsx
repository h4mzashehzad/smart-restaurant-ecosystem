import { Metadata } from 'next';
import QueueContainer from './QueueContainer';

export const metadata: Metadata = {
  title: 'Walk-In Queue Management — Admin',
  description: 'Manage front-of-house walk-in customers and waitlist.',
};

export default function QueueManagementPage() {
  return <QueueContainer />;
}
