import type { Metadata } from 'next';
import ReviewsContainer from './ReviewsContainer';

export const metadata: Metadata = {
  title: 'Reviews — Admin',
};

export default function AdminReviewsPage() {
  return <ReviewsContainer />;
}
