import Link from 'next/link';
import BestSellerRail from '@/components/menu/BestSellerRail';
import MenuBrowser from '@/components/menu/MenuBrowser';
import TodayPrices from '@/components/menu/TodayPrices';
import { HERO_IMAGE, photo } from '@/lib/images';
import { STORE } from '@/lib/mock-data';

const STEPS = [
  { n: 'I', title: 'Chọn món trên web', text: 'Chọn size, mức đường, mức đá, topping. Giá tính lại ngay, giỏ hàng giữ nguyên khi tải lại trang.' },
  { n: 'II', title: 'Trả qua VNPay', text: 'Thẻ ATM, thẻ quốc tế hoặc quét QR. Có điểm BrewLite thì trả bằng điểm. Bấm hai lần cũng chỉ trừ tiền một lần.' },
  { n: 'III', title: 'Đọc mã tại quầy', text: `Quầy pha đúng lúc bạn tới. Theo dõi đơn trên web: đang pha, sẵn sàng, đã giao. ${STORE.shortName}, mở ${STORE.hours}.` },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      {/* Trang nhất: bài chính bên trái, cột giá bên phải, cách nhau bằng đường kẻ dọc */}
      <section className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-0">
        <article className="lg:border-r lg:border-roast lg:pr-8">
          <p className="kicker">Tin trong ngày · Ưu đãi đang áp dụng</p>
          <h1 className="mt-2 text-4xl font-black leading-[1.02] sm:text-6xl">Trả qua VNPay, giảm ngay 20% cho mỗi đơn</h1>
          <p className="mt-3 font-serif text-lg italic text-roast/75">Nhập mã VNPAY20 ở bước thanh toán, giảm tối đa 25.000đ. Đặt trước, tới quầy là có ly.</p>
          <figure className="mt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo(HERO_IMAGE, 1400)} alt="Barista rót sữa tạo hình trên ly cà phê" className="newsprint aspect-[16/9] w-full object-cover" fetchPriority="high" />
            <figcaption className="mt-1.5 border-b border-roast pb-1.5 font-label text-[11px] uppercase tracking-wider text-roast/60">Ảnh minh hoạ · Quầy pha BrewLite</figcaption>
          </figure>
          <div className="mt-4 gap-6 text-[15px] leading-relaxed sm:columns-2">
            <p className="first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8]">
              Bảy giờ sáng, hàng người trước quầy An Dương Vương thường dài tới tận vỉa hè. Từ nay khách không phải chờ: chọn món trên điện thoại, trả tiền qua cổng VNPay, rồi tới quầy đọc mã đơn để nhận ly đã pha sẵn.
            </p>
            <p className="mt-3 sm:mt-0">
              Mỗi 1.000đ thanh toán được cộng 1 điểm BrewLite, dùng để đổi bánh, nâng size hoặc trả thẳng cho đơn sau. Mã giảm giá áp dụng ngay ở bước thanh toán, máy chủ tự tính lại giá nên không lo sai tiền.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#menu" className="inline-flex h-12 items-center bg-gold px-7 font-label text-sm font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep">
              Đặt món ngay
            </Link>
            <Link href="/uu-dai" className="inline-flex h-12 items-center border-2 border-roast px-6 font-label text-sm font-semibold uppercase tracking-wider hover:bg-roast hover:text-cream">
              Xem mã ưu đãi
            </Link>
          </div>
        </article>

        <aside className="lg:pl-8" aria-labelledby="prices-title">
          <h2 id="prices-title" className="kicker border-b-2 border-gold pb-1">Giá hôm nay · nghìn đồng</h2>
          <TodayPrices />
          <Link href="/menu" className="mt-3 inline-block font-label text-xs uppercase tracking-wider underline underline-offset-4 hover:text-gold">
            Xem cả thực đơn →
          </Link>
          <div className="mt-8 border-2 border-roast p-4 text-center">
            <p className="kicker">Khách quen</p>
            <p className="mt-1 font-display text-2xl font-black leading-tight">Tặng 1.250 điểm khi mở tài khoản</p>
            <p className="mt-2 text-sm text-roast/75">Đủ đổi một ly cà phê size S hoặc một bánh croissant bơ.</p>
            <Link href="/register" className="mt-3 inline-block font-label text-xs uppercase tracking-wider underline underline-offset-4 hover:text-gold">
              Đăng ký →
            </Link>
          </div>
        </aside>
      </section>

      {/* Ba bước đặt món, chia cột như một mục chuyên đề */}
      <section className="mt-12 border-y-[3px] border-double border-roast py-6" aria-labelledby="how-title">
        <h2 id="how-title" className="text-center text-3xl font-black">Đặt một ly cà phê, ba bước</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3 md:gap-0">
          {STEPS.map((s, i) => (
            <li key={s.n} className={`md:px-6 ${i > 0 ? 'md:border-l md:border-roast' : ''}`}>
              <span className="font-display text-4xl font-black text-gold">{s.n}.</span>
              <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-roast/80">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-12">
        <BestSellerRail />
      </div>

      <div className="mt-12" id="menu">
        <MenuBrowser title="Thực đơn hôm nay" />
      </div>
    </main>
  );
}
