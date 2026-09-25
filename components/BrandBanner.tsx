import Image from "next/image";
import Link from "next/link";

export default function BrandBanner() {
  return (
    <section
      className="relative overflow-hidden pt-8 md:pt-12 pb-8 md:pb-12 border-y border-cream-line min-h-[350px] md:min-h-[450px] flex items-center"
      style={{ backgroundImage: "linear-gradient(135deg, #0D0F0E 0%, #141614 60%, #1A1D1B 100%)" }}
    >
      <div className="max-w-wrap mx-auto px-4 sm:px-5 md:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 xl:gap-16 items-center">

          {/* Left Column: Brand Content and CTA (Centered) */}
          <div className="flex flex-col items-center text-center py-8 lg:py-12 justify-center">
            {/* Monogram Logo */}
            <div className="relative w-14 sm:w-16 h-14 sm:h-16 mb-3 sm:mb-4">
              <Image
                src="/TeenZos_Logo.png"
                alt="TeenZos Logo"
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            {/* Brand Title */}
            <h3 className="font-display font-bold text-xl sm:text-2xl md:text-3xl tracking-[0.2em] text-pink uppercase">
              TEENZOS<span className="text-[8px] sm:text-[10px] uppercase align-super font-medium">®</span>
            </h3>

            {/* Tagline */}
            <p className="mt-2 sm:mt-3 font-display italic text-2xl sm:text-3xl md:text-4xl text-gold leading-none">
              Wear the Attitude
            </p>
            <div className="w-20 h-[1px] bg-gold/40 my-3 sm:my-4" />

            {/* Main Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-ink/70 font-body max-w-[480px]">
              Heavyweight streetwear for the ones who move different.
            </p>

            {/* CTA Button */}
            <Link
              href="/shop"
              className="mt-6 sm:mt-8 inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-emerald text-cream font-body font-semibold text-[14px] sm:text-[15px] tracking-wide shadow-card hover:bg-emerald-deep hover:text-emerald transition-all hover:scale-[1.02]"
            >
              Shop Collection
            </Link>
          </div>

          {/* Right Column: Product Image with Rounded Corners */}
          <div className="relative w-full h-[280px] sm:h-[350px] md:h-[400px] lg:h-[480px] xl:h-[520px] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-soft border border-cream-line bg-cream-deep">
            <Image
              src="/OVERSIZED_person.png"
              alt="Teenzosstore Premium Wear"
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 550px"
              className="object-cover object-center transition-all duration-700 hover:scale-[1.03]"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
