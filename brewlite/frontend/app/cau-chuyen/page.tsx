import type { Metadata } from 'next';
import Link from 'next/link';
import Article from '@/components/layout/Article';
import { AUTH_IMAGE, photo } from '@/lib/images';
import { STORE } from '@/lib/mock-data';

export const metadata: Metadata = { title: 'Câu chuyện – BrewLite', description: 'Một quầy cà phê nhỏ ở góc An Dương Vương.' };

export default function StoryPage() {
  return (
    <Article kicker="Câu chuyện" title="Một quầy cà phê nhỏ ở góc An Dương Vương" lead="Sáng nào cũng có một hàng dài người đứng chờ gọi món. Chúng tôi muốn bạn khỏi phải chờ.">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo(AUTH_IMAGE, 1200)} alt="Barista rót sữa vào ly cà phê" className="newsprint aspect-[21/9] w-full object-cover" />
      <div className="mt-6 gap-8 sm:columns-2">
        <p className="first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8]">
          BrewLite mở cửa từ 6 giờ 30 sáng ở {STORE.address}. Cà phê pha phin từ hạt robusta rang mộc, cà phê máy từ arabica, cùng trà trái cây và bánh nướng mỗi sáng.
        </p>
        <p className="mt-3">
          Giờ cao điểm, quán đông nhất là lúc gọi món và trả tiền. Vì vậy chúng tôi để bạn đặt trước trên điện thoại: chọn món, chọn độ ngọt, lượng đá, trả qua VNPay, rồi ghé quầy nhận ly đã pha sẵn.
        </p>
        <p className="mt-3">
          Khách quen được tích điểm sau mỗi đơn để đổi bánh, nâng size hoặc trừ vào lần sau. Có góp ý gì về đồ uống, bạn cứ nhắn cho chúng tôi ở mục Liên hệ.
        </p>
      </div>
      <blockquote className="my-8 border-y-[3px] border-double border-roast py-5 text-center font-display text-2xl font-bold italic leading-snug sm:text-3xl">
        “Pha đúng lúc bạn tới, để ly cà phê luôn còn thơm.”
      </blockquote>
      <Link href="/menu" className="inline-flex h-11 items-center bg-gold px-6 font-label text-sm font-semibold uppercase tracking-wider text-foam hover:bg-gold-deep">
        Xem thực đơn
      </Link>
    </Article>
  );
}
