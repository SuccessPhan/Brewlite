'use client';

// Khung khu Quản lý (quyền MANAGER do InternalShell kiểm tra); thanh mục bên trái (máy tính) hoặc hàng tab cuộn ngang (điện thoại)
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SHOW_DEMO_HINTS } from '@/lib/demo';
import { stateOf, useInventory } from '@/lib/inventory';
import InternalShell from '@/components/internal/InternalShell';

const SECTIONS = [
  { href: '/quan-ly', label: 'Tổng quan' },
  { href: '/quan-ly/nguyen-lieu', label: 'Nguyên liệu' },
  { href: '/quan-ly/nhap-kho', label: 'Nhập kho' },
  { href: '/quan-ly/kiem-kho', label: 'Kiểm kho' },
  { href: '/quan-ly/cong-thuc', label: 'Công thức' },
  { href: '/quan-ly/nha-cung-cap', label: 'Nhà cung cấp' },
];

export default function ManagerShell({ children }: { children: ReactNode }) {
  return (
    <InternalShell>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6">
        <ManagerNav>{children}</ManagerNav>
      </main>
    </InternalShell>
  );
}

function ManagerNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const alerts = useInventory((s) => s.ingredients.filter((i) => stateOf(i) !== 'ok').length);

  const active = (href: string) => (href === '/quan-ly' ? pathname === href : pathname.startsWith(href));

  return (
    <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:gap-8">
      <nav aria-label="Mục quản lý" className="no-scrollbar -mx-4 mb-6 flex gap-1 overflow-x-auto border-b-2 border-roast px-4 lg:mx-0 lg:mb-0 lg:block lg:self-start lg:border-b-0 lg:border-r-2 lg:px-0 lg:pr-4 lg:sticky lg:top-20">
        <p className="kicker hidden px-3 pb-3 lg:block">Sổ kho BrewLite</p>
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active(s.href) ? 'page' : undefined}
            className={`flex shrink-0 items-center justify-between gap-2 border-b-[3px] px-3 py-2.5 font-label text-sm font-semibold uppercase tracking-wider lg:border-b-0 lg:border-l-[3px] ${
              active(s.href) ? 'border-gold text-roast lg:bg-roast/5' : 'border-transparent text-roast/60 hover:text-roast'
            }`}
          >
            {s.label}
            {s.href === '/quan-ly/nguyen-lieu' && alerts > 0 && <span className="bg-chili px-1.5 font-mono text-[10px] leading-4 text-foam">{alerts}</span>}
          </Link>
        ))}
      </nav>

      <div className="min-w-0">
        {SHOW_DEMO_HINTS && (
          <p className="mb-4 border-l-4 border-gold bg-gold/10 px-3 py-2 text-xs text-roast/75">
            Đang dùng dữ liệu kho mẫu để trình bày giao diện. Thao tác chỉ lưu tạm trên trình duyệt, tải lại trang sẽ về như ban đầu.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
