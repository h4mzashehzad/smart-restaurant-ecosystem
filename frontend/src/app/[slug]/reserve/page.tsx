import ReservationContainer from './ReservationContainer';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Reserve a Table — ${name}`,
    description: `Book your table at ${name}. Choose your date, time, and preferred table.`,
  };
}

export default async function ReservationPage({ params }: Props) {
  const { slug } = await params;
  return <ReservationContainer slug={slug} />;
}
