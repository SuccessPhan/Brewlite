import type { Metadata } from 'next';
import Recipes from '@/components/manager/Recipes';

export const metadata: Metadata = { title: 'Công thức – Quản lý BrewLite' };

export default function Page() {
  return <Recipes />;
}
