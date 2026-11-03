import type { Metadata } from 'next';
import Link from 'next/link';
import Article from '@/components/layout/Article';

export const metadata: Metadata = { title: 'Ưu đãi – BrewLite', description: 'Mã giảm giá đang áp dụng và cách đổi điểm BrewLite lấy quà.' };

// Khớp với bảng Voucher và danh sách quà ở backend (src/seed.ts, src/auth/rewards.ts)
const VOUCHERS = [
  { code: 'VNPAY20', title: 'Giảm 20% khi trả qua VNPay', terms: 'Tối đa 25.000đ. Chỉ áp dụng khi chọn thanh toán VNPay.' },
  { code: 'BREW20', title: 'Giảm 20% cho đơn từ 50.000đ', terms: 'Tối đa 20.000đ. Áp dụng mọi phương thức thanh toán.' },
  { code: 'FREESHIP', title: 'Miễn phí giao hàng', terms: 'Áp dụng khi chọn giao tận nơi, phí giao thường là 15.000đ.' },
];

const REWARDS = [
  { cost: 300, name: 'Nâng size miễn phí 1 ly' },
  { cost: 600, name: 'Bánh croissant bơ' },
  { cost: 800, name: 'Ly cà phê size S bất kỳ' },
];

export default function DealsPage() {
  return (
    <Article kicker="Mục ưu đãi" title="Mã giảm giá đang áp dụng" lead="Nhập mã ở bước thanh toán. Máy chủ kiểm tra điều kiện và tự tính lại số tiền, mỗi đơn dùng một mã.">
      <ul className="grid gap-4 sm:grid-cols-3">
        {VOUCHERS.map((v) => (
          <li key={v.code} className="border-2 border-dashed border-roast p-4">
            <p className="stamp text-gold">{v.code}</p>
            <h2 className="mt-3 text-xl font-bold leading-tight">{v.title}</h2>
            <p className="mt-2 text-sm text-roast/75">{v.terms}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 border-t-[3px] border-double border-roast pt-4 text-3xl font-black">Đổi điểm lấy quà</h2>
      <p className="mt-2 text-roast/80">
        Mỗi 1.000đ thanh toán thành công được cộng 1 điểm. Tài khoản mới được tặng sẵn 1.250 điểm. Điểm cũng dùng để trả thẳng cho đơn (100đ mỗi điểm).
      </p>
      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-roast text-xs uppercase">
            <th className="py-2">Quà</th>
            <th className="py-2 text-right">Điểm cần</th>
          </tr>
        </thead>
        <tbody>
          {REWARDS.map((r) => (
            <tr key={r.name} className="border-b border-dotted border-roast/60">
              <td className="py-2.5">{r.name}</td>
              <td className="py-2.5 text-right tabular-nums">{r.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/menu" className="inline-flex h-11 items-center bg-gold px-6 font-label text-sm font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep">
          Đặt món, dùng mã
        </Link>
        <Link href="/account" className="inline-flex h-11 items-center border-2 border-roast px-5 font-label text-sm font-semibold uppercase tracking-wider hover:bg-roast hover:text-cream">
          Xem điểm của tôi
        </Link>
      </div>
    </Article>
  );
}
