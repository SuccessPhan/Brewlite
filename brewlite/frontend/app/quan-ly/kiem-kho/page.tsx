import type { Metadata } from 'next';
import Stocktake from '@/components/manager/Stocktake';

export const metadata: Metadata = { title: 'Kiểm kho – Quản lý BrewLite' };

export default function Page() {
  return <Stocktake />;
}
