import type { Metadata } from 'next';
import InternalShell from '@/components/internal/InternalShell';
import StaffQueue from '@/components/staff/StaffQueue';

export const metadata: Metadata = { title: 'Quầy pha chế – BrewLite' };

export default function StaffPage() {
  return (
    <InternalShell>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Quầy pha chế</h1>
        <StaffQueue />
      </main>
    </InternalShell>
  );
}
