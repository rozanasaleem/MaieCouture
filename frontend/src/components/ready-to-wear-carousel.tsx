"use client";

import Link from "next/link";
import { useRef } from "react";

type ReadyWearCarouselCard = {
  slug: string;
  label: string;
  href: string;
  image: string | null;
};

export function ReadyToWearCarousel({
  title,
  cards,
}: {
  title: string;
  cards: ReadyWearCarouselCard[];
}) {
  const railRef = useRef<HTMLDivElement>(null);

  function scrollByCards(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card?.offsetWidth ?? 280;
    const step = (cardWidth + 16) * 2;
    const maxLeft = rail.scrollWidth - rail.clientWidth;
    const current = rail.scrollLeft;
    const nearStart = current <= 8;
    const nearEnd = current >= maxLeft - 8;

    if (direction === 1 && nearEnd) {
      rail.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && nearStart) {
      rail.scrollTo({ left: maxLeft, behavior: "smooth" });
      return;
    }

    rail.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-10 lg:py-12">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-[family-name:var(--font-display)] text-[1.7rem] text-[--ink] sm:text-[2rem]">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[--line] text-[--ink] transition hover:bg-[--stone]"
            aria-label="Previous"
          >
            <span className="text-lg leading-none">‹</span>
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[--line] text-[--ink] transition hover:bg-[--stone]"
            aria-label="Next"
          >
            <span className="text-lg leading-none">›</span>
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={card.href}
            data-card
            className="group relative block aspect-[4/5] w-[72vw] shrink-0 snap-start overflow-hidden rounded-md border border-[--line] bg-[linear-gradient(180deg,#f7f4ee_0%,#ece5da_100%)] sm:w-[44vw] lg:w-[22.5rem]"
          >
            {card.image && (
              <div
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${card.image})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-[family-name:var(--font-display)] text-lg text-white sm:text-xl">
                {card.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
