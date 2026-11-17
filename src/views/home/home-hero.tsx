"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type Slide = { kicker: string; title: string; cta: string; href: string; image: string };
type Banner = { href: string; image: string; label: string };

export function HomeHero({ slides, banners }: { slides: Slide[]; banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = Math.max(slides.length, banners.length);

  useEffect(() => {
    if (paused || slideCount === 0) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % slideCount), 6500);
    return () => clearInterval(timer);
  }, [slideCount, paused]);

  const mobileIndex = banners.length ? index % banners.length : 0;
  const desktopIndex = slides.length ? index % slides.length : 0;

  return (
    <div
      className={`rise-in delay-2 relative aspect-[340/350] overflow-hidden rounded-[20px] bg-white lg:aspect-auto lg:min-h-[540px] lg:rounded-[28px] lg:bg-[#f6f6f7] ${paused ? "hero-paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((banner, i) => {
        const active = i === mobileIndex;
        return (
          <Link
            key={banner.image}
            href={banner.href}
            tabIndex={active ? 0 : -1}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ease-out lg:hidden ${
              active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img src={banner.image} alt={banner.label} className="h-full w-full object-cover" />
          </Link>
        );
      })}
      {slides.map((slide, i) => {
        const active = i === desktopIndex;
        return (
          <div key={slide.kicker} className="absolute inset-0 hidden lg:block" aria-hidden={!active}>
            <div
              className={`absolute inset-0 flex flex-col items-center justify-between px-6 py-8 pb-14 transition-opacity duration-700 ease-out ${
                active ? "z-10 opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <div className={`text-center transition-transform duration-700 ease-out ${active ? "translate-y-0" : "translate-y-2"}`}>
                <p className="text-sm font-semibold text-muted">{slide.kicker}</p>
                <h2 className="mx-auto mt-2 max-w-md text-3xl font-bold leading-snug text-ink sm:text-4xl">{slide.title}</h2>
                <p className="mt-3 text-2xl font-bold text-brand sm:text-3xl">stc</p>
              </div>
              <img
                src={slide.image}
                alt=""
                className={`my-4 h-44 w-full object-contain transition-transform duration-700 ease-out sm:h-56 ${active ? "scale-100" : "scale-95"}`}
              />
              <Link href={slide.href} className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                {slide.cta}
              </Link>
            </div>
          </div>
        );
      })}
      <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-1.5 lg:hidden">
        {banners.map((item, dot) => (
          <button
            key={item.image}
            type="button"
            aria-label={item.label}
            aria-current={dot === mobileIndex ? "true" : undefined}
            onClick={() => setIndex(dot)}
            className={`rounded-full ${dot === mobileIndex ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/75"}`}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-6 z-20 hidden justify-center gap-2 lg:flex">
        {slides.map((item, dot) => (
          <button
            key={item.kicker}
            type="button"
            aria-label={item.kicker}
            aria-current={dot === desktopIndex ? "true" : undefined}
            onClick={() => setIndex(dot)}
            className={`h-2 rounded-full ${dot === desktopIndex ? "w-6 bg-brand" : "w-2 bg-[#d0d0d0] hover:bg-[#b5b5b5]"}`}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 hidden h-1 bg-black/5 lg:block">
        <div key={index} className="hero-progress h-full bg-brand" />
      </div>
    </div>
  );
}
