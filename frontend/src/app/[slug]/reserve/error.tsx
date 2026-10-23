'use client';

export default function Error({ reset }: { reset: () => void }) {
  return <div className="p-12 text-center space-y-4"><p className="text-gray-600">Could not open table reservations.</p><button onClick={reset} className="rounded-xl bg-orange-500 px-5 py-3 text-white">Try again</button></div>;
}
