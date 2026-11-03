import Link from 'next/link';
import HomeSidebar from '@/components/home/HomeSidebar';
import BestSellerRail from '@/components/menu/BestSellerRail';
import MenuBrowser from '@/components/menu/MenuBrowser';
import { HERO_IMAGE, photo } from '@/lib/images';

const STEPS = [
  { n: 'I', title: 'Chọn món', text: 'Chọn size, độ ngọt, lượng đá và topping theo đúng khẩu vị của bạn.' },
  { n: 'II', title: 'Thanh toán', text: 'Trả bằng thẻ ATM, thẻ quốc tế, quét QR qua VNPay hoặc dùng điểm BrewLite.' },
  { n: 'III', title: 'Nhận món', text: 'Ly sẵn sàng là web báo ngay. Tới quầy đọc mã đơn là nhận, không phải xếp hàng.' },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      {/* Trang nhất: bài chính bên trái, cột giá bên phải, cách nhau bằng đường kẻ dọc */}
      <section className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:gap-0">
        <article className="lg:border-r lg:border-roast lg:pr-8">
          <p className="kicker">Cà phê kiểu Sài Gòn xưa</p>
          <h1 className="mt-2 text-4xl font-black leading-[1.02] sm:text-6xl">Ly phin chậm rãi ngày xưa, nay đặt trước khỏi chờ</h1>
          <figure className="mt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo(HERO_IMAGE, 1400)} alt="Góc quán với bàn ghế gỗ, ghế đệm và sàn gạch bông" className="newsprint aspect-[16/9] w-full object-cover" fetchPriority="high" />
            <figcaption className="mt-2 border-b border-roast pb-3 font-serif text-lg italic leading-snug text-roast/80">
              Bàn gỗ, ghế đệm, sàn gạch bông và tiếng phin nhỏ giọt, như một quán quen của Sài Gòn những năm 80.
            </figcaption>
          </figure>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8]">
            Đặt món trên điện thoại trước khi ra khỏi nhà, tới quầy là có ly. Mỗi 1.000đ bạn được tích 1 điểm, dùng để đổi bánh, nâng size hoặc trừ thẳng vào đơn sau.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#menu" className="inline-flex h-12 items-center bg-gold px-7 font-label text-sm font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep">
              Đặt món ngay
            </Link>
            <Link href="/uu-dai" className="inline-flex h-12 items-center border-2 border-roast px-6 font-label text-sm font-semibold uppercase tracking-wider hover:bg-roast hover:text-cream">
              Xem mã ưu đãi
            </Link>
          </div>
        </article>

        <HomeSidebar />
      </section>

      {/* Ba bước đặt món, chia cột như một mục chuyên đề */}
      <section className="mt-12 border-y-[3px] border-double border-roast py-6" aria-labelledby="how-title">
        <h2 id="how-title" className="text-center text-3xl font-black">Đặt món chỉ ba bước</h2>
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
