'use client';

// Cột "Được gọi nhiều hôm nay" ở trang nhất: bấm tên xem món, bấm + để chọn tuỳ chọn và thêm vào giỏ ngay
import Link from 'next/link';
import { formatNumber } from '@/lib/format';
import { useProducts } from '@/lib/products';
import { useProductSheet } from '@/components/product/ProductSheetProvider';
import Skeleton from '@/components/ui/Skeleton';
import { PlusIcon } from '@/components/ui/Icons';

export default function TodayPrices() {
  const { data, isError } = useProducts();
  const { openProduct } = useProductSheet();

  if (isError) return <p className="py-4 text-sm text-chili">Chưa tải được bảng giá.</p>;
  if (!data) {
    return (
      <div className="space-y-3 py-2" aria-busy="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-6" />
        ))}
      </div>
    );
  }

  const top = [...data].sort((a, b) => b.sold - a.sold).slice(0, 7);
  return (
    <ul>
      {top.map((p) => (
        <li key={p.id} className="flex items-center gap-2 border-b border-dotted border-roast/50">
          <Link href={`/product/${p.id}`} className="flex min-w-0 flex-1 items-baseline justify-between gap-3 py-2 hover:text-gold">
            <span>
              {p.name}
              {p.stock > 0 && p.stock <= 10 && <span className="ml-2 font-label text-[11px] uppercase tracking-wider text-gold">còn {p.stock}</span>}
              {p.stock <= 0 && <span className="ml-2 font-label text-[11px] uppercase tracking-wider text-roast/50">hết hàng</span>}
            </span>
            <span className="tabular-nums text-sm">{formatNumber(p.price)}</span>
          </Link>
          <button
            type="button"
            onClick={() => openProduct(p.id)}
            disabled={p.stock <= 0}
            aria-label={`Thêm ${p.name} vào giỏ`}
            className="grid h-8 w-8 shrink-0 place-items-center border-2 border-roast transition-colors enabled:hover:bg-roast enabled:hover:text-cream disabled:border-roast/25 disabled:text-roast/30"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
