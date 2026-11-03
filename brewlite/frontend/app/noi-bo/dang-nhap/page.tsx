import type { Metadata } from 'next';
import InternalLogin from '@/components/internal/InternalLogin';
import { safeNext } from '@/lib/safe-next';

export const metadata: Metadata = { title: 'Đăng nhập nội bộ – BrewLite' };

export default async function InternalLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <InternalLogin next={safeNext(next)} />;
}
