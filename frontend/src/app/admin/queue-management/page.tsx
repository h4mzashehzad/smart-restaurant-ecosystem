import { redirect } from 'next/navigation';

// Legacy route — walk-in queue management now lives at /admin/queue.
export default function QueueManagementRedirectPage() {
  redirect('/admin/queue');
}
