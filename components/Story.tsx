"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import BotanicalDivider from "./BotanicalDivider";
import { IconTulip } from "./Icons";
import { cloudinaryLoaderFor } from "@/lib/cloudinaryImage";
import {
  DEFAULT_ABOUT_SECTION,
  type AboutSectionSettings,
} from "@/lib/aboutSection";

export default function Story({
  settings = DEFAULT_ABOUT_SECTION,
}: {
  settings?: AboutSectionSettings;
}) {
  const stats = [
    { value: settings.stat_one_value, label: settings.stat_one_label },
    { value: settings.stat_two_value, label: settings.stat_two_label },
    { value: settings.stat_three_value, label: settings.stat_three_label },
  ];

  return (
    <section id="story" className="relative py-12 md:py-16 bg-[#E4E0DD]">
      <div className="max-w-wrap mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative max-w-[460px] mx-auto">
              <div className="relative aspect-[5/6] rounded-[32px] overflow-hidden shadow-soft border border-[#E6DAC4]">
                <Image
                  src={settings.image_url}
                  alt="Teenzosstore streetwear in the wild"
                  fill
                  loader={cloudinaryLoaderFor(settings.image_url)}
                  unoptimized={!settings.image_url?.startsWith("https://res.cloudinary.com/")}
                  sizes="(max-width: 768px) 90vw, 460px"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-2 md:-bottom-8 -left-4 md:-left-8 bg-white rounded-2xl shadow-card px-5 py-4 max-w-[200px] border border-[#E6DAC4]">
                <p className="font-display font-bold text-2xl text-[#B9893F] leading-none">
                  {settings.badge_value}
                </p>
                <p className="text-xs text-[#5A5550] font-medium mt-1">
                  {settings.badge_label}
                </p>
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2 flex flex-col items-center text-center lg:py-4">
            <Reveal>
              <div className="inline-flex items-center gap-2 text-[13px] md:text-sm font-bold tracking-[0.25em] uppercase text-[#8A6A26]">
                <IconTulip className="w-4 h-4 text-[#B9893F]" />
                {settings.eyebrow}
              </div>
            </Reveal>
            <Reveal delay={1}>
              <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl text-[#0B0C0B] uppercase tracking-wide">
                {settings.headline_top}
                <br />
                {settings.headline_bottom}
              </h2>
            </Reveal>
            <Reveal delay={2}>
              <p className="mt-5 text-[#5A5550] font-body text-sm md:text-base max-w-[520px] mx-auto leading-relaxed">
                {settings.paragraph_one}
              </p>
            </Reveal>
            <Reveal delay={3}>
              <p className="mt-4 text-[#5A5550] font-body text-sm md:text-base max-w-[520px] mx-auto leading-relaxed">
                {settings.paragraph_two}
              </p>
            </Reveal>
            <Reveal
              delay={4}
              className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-4 w-full"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <p className="font-display font-bold text-2xl text-[#B9893F]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#5A5550] font-medium mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
      <BotanicalDivider tone="gold" />
    </section>
  );
}
