import type { Metadata } from 'next';
import Suppliers from '@/components/manager/Suppliers';

export const metadata: Metadata = { title: 'Nhà cung cấp – Quản lý BrewLite' };

export default function Page() {
  return <Suppliers />;
}
