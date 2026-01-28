'use client';

import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';

interface Card {
  id: string;
  title: string;
  description: string;
  letter: string;
  color: string;
}

interface HomeCardsProps {
  cards: Card[];
}

export function HomeCards({ cards }: HomeCardsProps) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    const mainContent = document.querySelector('main');

    if (target && mainContent) {
      // Стандартный скролл браузера обычно длится ~500-800мс
      // Делаем его быстрым (300мс) с приятным ускорением/замедлением
      gsap.to(mainContent, {
        duration: 0.4,
        scrollTop: target.offsetTop - 80, // 80px отступ сверху (scroll-mt-20)
        ease: 'power2.out',
      });

      // Обновляем URL без прыжка
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-10 not-prose">
      {cards.map((card, idx) => (
        <a
          key={idx}
          href={`#${card.id}`}
          onClick={(e) => handleScroll(e, card.id)}
          className="group relative p-4 bg-background-tertiary rounded-lg border border-background-border transition-colors duration-200 cursor-pointer no-underline! block"
        >
          <div className="flex justify-between items-start mb-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${card.color}`}
            >
              {card.letter}
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
          </div>
          <h3 className="text-base font-medium text-text-primary mt-0! mb-1! group-hover:text-primary transition-colors">
            {card.title}
          </h3>
          <p className="text-[14px]! text-text-secondary! leading-snug mb-0! group-hover:text-primary transition-colors">
            {card.description}
          </p>
        </a>
      ))}
    </div>
  );
}
