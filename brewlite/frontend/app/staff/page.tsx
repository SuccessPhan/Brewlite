import type { Metadata } from 'next';
import AuthGate from '@/components/auth/AuthGate';
import StaffQueue from '@/components/staff/StaffQueue';

export const metadata: Metadata = { title: 'Quầy pha chế – BrewLite' };

export default function StaffPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Quầy pha chế</h1>
      <AuthGate title="Đăng nhập tài khoản nhân viên" description="Trang này chỉ dành cho nhân viên quầy BrewLite.">
        <StaffQueue />
      </AuthGate>
    </main>
  );
}
