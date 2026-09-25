"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navLinks, SITE } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/context/CartContext";
import CartDrawer from "./CartDrawer";
import {
  Search,
  User,
  ShoppingBag,
  LogOut,
  LayoutDashboard,
  X,
  ArrowRight,
  Sparkles,
  Flame,
  Tag,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { getShippingSettings } from "@/actions/admin/shipping";
import { getCurrentUserForClient, logoutForClient } from "@/actions/auth";
import AnnouncementBar from "./AnnouncementBar";
import { getAnnouncement } from "@/actions/admin/announcements";

const HEADER_CATEGORIES = [
  { id: "men", name: "Men", href: "/shop?category=men" },
  { id: "women", name: "Women", href: "/shop?category=women" },
  { id: "new-arrivals", name: "New Arrivals", href: "/shop?category=new-arrivals" },
  { id: "hoodies", name: "Hoodies", href: "/shop?category=hoodies" },
  { id: "t-shirts", name: "T-Shirts", href: "/shop?category=t-shirts" },
  { id: "sweatshirts", name: "Sweatshirts", href: "/shop?category=sweatshirts" },
  { id: "jackets", name: "Jackets", href: "/shop?category=jackets" },
  { id: "bottoms", name: "Bottoms", href: "/shop?category=bottoms" },
  { id: "accessories", name: "Accessories", href: "/shop?category=accessories" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileCollectionOpen, setMobileCollectionOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cartCount } = useCart();
  const [user, setUser] = useState<any>(null);
  const isAdmin = user && user.user_metadata?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDesktopSearch, setShowDesktopSearch] = useState(false);
  const [shipping, setShipping] = useState<any>(null);
  const [navCategories] = useState<any[]>(HEADER_CATEGORIES);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    getShippingSettings()
      .then((data) => setShipping(data))
      .catch((err) =>
        console.error("Error loading header shipping settings:", err),
      );

    getAnnouncement()
      .then((announcement) =>
        setAnnouncementVisible(
          !!announcement?.is_active && !!announcement.message.trim(),
        ),
      )
      .catch(() => setAnnouncementVisible(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentSearch = params.get("search");
    if (currentSearch) setSearchQuery(currentSearch);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setOpen(false);
      setShowMobileSearch(false);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const result = await getCurrentUserForClient();
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email,
            user_metadata: {
              role: result.user.role,
              full_name: result.user.full_name,
            },
          });
          return;
        }
      } catch (error) {
        console.error("Error loading user session:", error);
      }

      setUser(null);
    };

    checkUserSession();

    window.addEventListener("rawflex-login-status-change", checkUserSession);
    return () => {
      window.removeEventListener(
        "rawflex-login-status-change",
        checkUserSession,
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <AnnouncementBar />
      <header
        className={`fixed ${announcementVisible ? "top-8 md:top-9" : "top-0"} inset-x-0 z-[99999] bg-white border-b border-gray-200/90 shadow-sm transition-all duration-300`}
      >
        <div className="relative max-w-wrap mx-auto px-4 md:px-7 flex items-center justify-between h-[66px] md:h-[76px]">
          {/* Mobile hamburger — left side on mobile */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              setOpen((v) => !v);
              setShowMobileSearch(false);
            }}
            className="lg:hidden relative h-9 w-9 flex items-center justify-center text-ink shrink-0 transition-all rounded-full hover:bg-gray-100"
          >
            <span className="sr-only">Menu</span>
            {open ? (
              <svg
                className="w-5 h-5 text-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

          {/* Logo + Text — Left on Desktop, Center on Mobile */}
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-2.5 shrink-0 lg:static absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 group py-1"
            aria-label="TeenZos Home"
          >
            <Image
              src="/TeenZos_Logo.png"
              alt="TeenZos Logo"
              width={130}
              height={50}
              className="object-contain h-[34px] sm:h-[40px] md:h-[46px] w-auto shrink-0"
              priority
              unoptimized
            />
            <div className="flex flex-col justify-center leading-none">
              <span className="font-display font-[500] text-base sm:text-lg md:text-xl lg:text-2xl tracking-[0.09em] text-ink group-hover:text-pink transition-colors">
                TeenZos<span className="text-pink">.</span>
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] md:text-[9.5px] tracking-[0.18em] uppercase text-muted mt-0.5 font-[450]">
                WEAR YOUR VIBE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.label === "Collections") {
                return (
                  <div key={link.label} className="relative group py-2">
                    <Link
                      href={link.href}
                      className={`font-body text-[13px] md:text-[13.5px] xl:text-[14px] font-[650] tracking-wide transition-colors flex items-center gap-2 ${
                        isActive ? "text-pink" : "text-ink hover:text-pink"
                      }`}
                    >
                      {link.label}

                      <svg
                        className="w-3.5 h-3.5 text-ink/100 group-hover:text-pink transition-transform group-hover:rotate-180 duration-200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Link>

                    {/* Clean Minimalist Mega Menu Dropdown */}
                    <div className="absolute top-full left-1/2 -translate-x-[45%] pt-3 w-[720px] xl:w-[800px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-50 transform origin-top group-hover:translate-y-0 translate-y-2">
                      <div className="bg-white border border-gray-200/90 rounded-[5px] shadow-xl p-6 md:p-7">
                        {/* Top Accent Header */}
                        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-gray-100">
                          <span className="font-display font-[300] text-sm tracking-wider uppercase text-ink">
                            All Collections
                          </span>
                          <Link
                            href="/shop"
                            className="text-xs font-[550] text-pink hover:text-pink-dark flex items-center gap-1 transition-colors"
                          >
                            <span>View All Drops</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* 3-Column Clean Grid */}
                        <div className="grid grid-cols-12 gap-6">
                          {/* Col 1: Categories List */}
                          <div className="col-span-4 border-r border-gray-100 pr-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted mb-3">
                              Categories
                            </p>
                            <div className="space-y-2">
                              {navCategories.map((cat: any) => (
                                <Link
                                  key={cat.id}
                                  href={cat.href || `/shop?category=${cat.id}`}
                                  className="group/item flex items-center justify-between py-1 text-[13px] font-semibold text-ink/80 hover:text-pink transition-all hover:border-y-2 border-pink"
                                >
                                  <span>{cat.name}</span>
                                  <ArrowRight className="w-3 h-3 text-pink opacity-0 group-hover/item:opacity-100 transition-all" />
                                </Link>
                              ))}
                            </div>
                          </div>

                          {/* Col 2: Curated Drops */}
                          <div className="col-span-4 border-r border-gray-100 pr-4">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted mb-3">
                              Curated Drops
                            </p>
                            <div className="space-y-3.5">
                              <Link
                                href="/shop?category=bestseller"
                                className="group/drop block py-1 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-display font-[300] text-ink text-sm group-hover/drop:text-pink transition-colors">
                                    Hot Bestseller
                                  </p>
                                  <span className="text-[10px] font-extrabold text-pink bg-pink-soft px-2 py-0.5 rounded-full font-body">
                                    HOT
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted mt-0.5">
                                  Most popular streetwear fits
                                </p>
                              </Link>

                              <Link
                                href="/shop?category=trending"
                                className="group/drop block py-1 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-display font-[300] text-ink text-sm group-hover/drop:text-pink transition-colors">
                                    Trending
                                  </p>
                                  <span className="text-[10px] font-extrabold text-[#36B8C5] bg-[#E8FAF8] px-2 py-0.5 rounded-full font-body">
                                    TRENDING
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted mt-0.5">
                                  Viral fits setting the wave
                                </p>
                              </Link>

                              <Link
                                href="/shop?category=exclusive"
                                className="group/drop block py-1 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-display font-[300] text-ink text-sm group-hover/drop:text-pink transition-colors">
                                    Exclusive
                                  </p>
                                  <span className="text-[10px] font-extrabold text-[#9B51E0] bg-[#F4EDFC] px-2 py-0.5 rounded-full font-body">
                                    EXCLUSIVE
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted mt-0.5">
                                  Limited edition 1-of-1 drops
                                </p>
                              </Link>
                            </div>
                          </div>

                          {/* Col 3: Visual Feature Preview / Product Spotlight */}
                          <div className="col-span-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted">
                                  Spotlight
                                </p>
                                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#F72585] bg-[#FFE1ED] px-2 py-0.5 rounded-full font-body">
                                  🔥 HOT DROP
                                </span>
                              </div>

                              <Link
                                href="/shop/bunny-graffiti-hoodie"
                                className="group/card block rounded-[5px] overflow-hidden border border-gray-200 hover:border-[#F72585] hover:shadow-lg transition-all duration-300 bg-white"
                              >
                                <div className="relative h-[150px] w-full bg-[#F5F5F5] overflow-hidden">
                                  <Image
                                    src="/images/products/bunny-graffiti-hoodie.jpg"
                                    alt="Cyber Bunny Graffiti Hoodie"
                                    fill
                                    unoptimized
                                    className="object-cover object-top group-hover/card:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                    TRENDING
                                  </div>
                                </div>
                                <div className="p-3 bg-white">
                                  <p className="font-display font-[350] text-sm text-[#0B0D0E] group-hover/card:text-[#F72585] transition-colors leading-tight truncate">
                                    Cyber Bunny Graffiti Hoodie
                                  </p>
                                  <div className="flex items-start flex-col justify-between mt-1.5">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-body font-black text-sm text-[#0B0D0E]">
                                        ₹1,999
                                      </span>
                                      <span className="text-[11px] text-gray-400 line-through">
                                        ₹2,499
                                      </span>
                                      <span className="text-[10px] font-bold text-[#F72585]">
                                        20% OFF
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[11px] font-bold text-[#0B0D0E] group-hover/card:text-[#F72585] transition-colors">
                                      View Drop →
                                    </span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </div>

                            <Link
                              href="/shop"
                              className="mt-4 block text-center py-2 px-4 rounded-lg border border-gray-200 hover:border-[#F72585] text-[#0B0D0E] hover:text-[#F72585] text-xs font-semibold transition-colors"
                            >
                              Shop All Products →
                            </Link>
                          </div>
                        </div>

                        {/* Bottom Trust Line */}
                        <div className="mt-5 pt-3 border-t border-black/15 flex items-center justify-between text-xs text-muted">
                          <span>⚡ Free Shipping on Orders ₹999+</span>
                          <span>🔁 Easy 7 Days Return</span>
                          <span>📦 Pan-India COD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`font-body text-[13px] md:text-[13.5px] xl:text-[14px] font-[650] tracking-wide transition-colors relative group py-1 ${
                    isActive ? "text-pink" : "text-ink hover:text-pink"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-0 bottom-0 h-[2px] rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-full bg-pink"
                        : "w-0 bg-pink group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions Section */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5">
            {/* Search Icon Button */}
            <button
              onClick={() => setShowDesktopSearch(true)}
              aria-label="Search Products"
              title="Search Products"
              className="text-ink hover:text-pink transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <Search className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
            </button>

            {/* Account / User Actions */}
            <div className="flex items-center gap-4 shrink-0">
              {isAdmin && (
                <Link
                  href="/admin"
                  title="Admin Dashboard"
                  className="text-ink hover:text-pink transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <LayoutDashboard className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    title="Manage Profile"
                    className="text-ink hover:text-pink transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <User className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
                  </Link>
                  <button
                    onClick={async () => {
                      await logoutForClient();
                      localStorage.removeItem("rawflex-customer-profile");
                      setUser(null);
                      window.location.reload();
                    }}
                    title="Logout"
                    className="text-ink hover:text-pink transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <LogOut className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  title="Login / Register"
                  className="text-ink hover:text-pink transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <User className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
                </Link>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Shopping Cart"
              title="Shopping Cart"
              className="relative text-ink hover:text-pink transition-colors shrink-0 p-1 rounded-full hover:bg-gray-100"
            >
              <ShoppingBag className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink text-white text-[9px] font-[300] rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Right Icons (Search & Cart) */}
          <div className="lg:hidden flex items-center gap-1.5">
            <button
              onClick={() => setShowDesktopSearch(true)}
              className="h-9 w-9 flex items-center justify-center rounded-full text-ink hover:text-pink hover:bg-gray-100 transition-all shrink-0"
              title="Search Products"
            >
              <Search className="w-[19px] h-[19px]" />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-ink hover:text-pink hover:bg-gray-100 transition-all shrink-0"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-[19px] h-[19px]" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-pink text-white text-[9px] font-[300] rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Desktop / Mobile Search Popup Modal */}
        {showDesktopSearch && (
          <div
            className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 animate-fade-in"
            onClick={() => setShowDesktopSearch(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="font-display font-[300] text-lg md:text-xl text-ink flex items-center gap-2">
                  <Search className="w-5 h-5 text-pink" /> Search TeenZos Store
                </h3>
                <button
                  onClick={() => setShowDesktopSearch(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-ink hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  handleSearch(e);
                  setShowDesktopSearch(false);
                }}
                className="relative mt-5"
              >
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-pink" />
                <input
                  type="text"
                  placeholder="Search for tees, hoodies, acid wash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-28 text-sm md:text-base text-ink focus:bg-white focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/20 transition-all shadow-inner"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink hover:bg-pink-dark text-white font-[300] px-5 py-2 rounded-full text-sm shadow-sm transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="mt-6">
                <p className="text-xs font-[300] uppercase tracking-wider text-muted mb-3">
                  Popular Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {navCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        router.push(cat.href || `/shop?category=${cat.id}`);
                        setShowDesktopSearch(false);
                      }}
                      className="px-4 py-2 rounded-full bg-gray-100 hover:bg-pink-soft hover:text-pink text-xs font-[300] text-ink transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Fullscreen Navigation Drawer */}
        <div
          className={`lg:hidden fixed inset-x-0 ${announcementVisible ? "top-[96px] md:top-[100px]" : "top-[64px]"} bottom-0 bg-white z-[9999] overflow-y-auto transition-all duration-300 ${
            open
              ? "block opacity-100 pointer-events-auto"
              : "hidden opacity-0 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col px-6 pt-6 pb-12 gap-1">
            {/* Mobile Search Input */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for tees, hoodies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-full py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-pink transition-all"
              />
            </form>

            {navLinks.map((link, i) => {
              if (link.label === "Collections") {
                return (
                  <div
                    key={link.label}
                    className="border-b border-gray-100 py-3.5"
                  >
                    <button
                      onClick={() =>
                        setMobileCollectionOpen(!mobileCollectionOpen)
                      }
                      className="w-full flex items-center justify-between font-display text-xl font-[300] text-ink text-left hover:text-pink transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {link.label}
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-pink bg-pink-soft px-2 py-0.5 rounded-full font-body">
                          NEW
                        </span>
                      </span>
                      <svg
                        className={`w-5 h-5 text-pink transition-transform duration-200 ${mobileCollectionOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {mobileCollectionOpen && (
                      <div className="mt-4 space-y-4 flex flex-col animate-fade-in">
                        {/* Quick category links */}
                        <div className="grid grid-cols-2 gap-2">
                          {navCategories.map((cat: any) => (
                            <Link
                              key={cat.id}
                              href={cat.href || `/shop?category=${cat.id}`}
                              onClick={() => setOpen(false)}
                              className="px-3 py-2 rounded-lg border border-gray-100 text-xs font-semibold text-ink/80 hover:text-pink hover:border-pink transition-colors flex items-center justify-between"
                            >
                              <span>{cat.name}</span>
                              <ArrowRight className="w-3 h-3 text-gray-300" />
                            </Link>
                          ))}
                        </div>

                        {/* Curated drops in mobile */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                          <Link
                            href="/shop?category=bestseller"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between py-1.5 text-sm font-semibold text-ink hover:text-pink transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-pink" />
                              Hot Bestseller
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-pink font-extrabold">
                              HOT
                            </span>
                          </Link>

                          <Link
                            href="/shop?category=trending"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between py-1.5 text-sm font-semibold text-ink hover:text-pink transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#36B8C5]" />
                              Trending
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-[#36B8C5] font-extrabold">
                              TRENDING
                            </span>
                          </Link>

                          <Link
                            href="/shop?category=exclusive"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between py-1.5 text-sm font-semibold text-ink hover:text-pink transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-[#9B51E0]" />
                              Exclusive
                            </span>
                            <span className="text-[9px] uppercase tracking-widest text-[#9B51E0] font-extrabold">
                              EXCLUSIVE
                            </span>
                          </Link>

                          {/* Mobile Spotlight Featured Drop */}
                          <div className="pt-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-2">
                              Spotlight Drop
                            </p>
                            <Link
                              href="/shop/bunny-graffiti-hoodie"
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:border-pink transition-colors"
                            >
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                                <Image
                                  src="/images/products/bunny-graffiti-hoodie.jpg"
                                  alt="Cyber Bunny Graffiti Hoodie"
                                  fill
                                  unoptimized
                                  className="object-cover object-center"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-display font-bold text-xs text-ink truncate">
                                  Cyber Bunny Graffiti Hoodie
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-body font-black text-xs text-ink">₹1,999</span>
                                  <span className="text-[10px] text-gray-400 line-through">₹2,499</span>
                                  <span className="text-[10px] font-bold text-pink">20% OFF</span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-pink shrink-0 mr-1" />
                            </Link>
                          </div>

                          <Link
                            href="/shop"
                            onClick={() => setOpen(false)}
                            className="mt-2 text-center py-2.5 rounded-lg border border-pink text-pink font-[300] text-sm hover:bg-pink hover:text-white transition-colors"
                          >
                            Shop All Collections →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-xl font-[300] text-ink hover:text-pink py-3.5 border-b border-gray-100 transition-colors"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  {link.label}
                </Link>
              );
            })}

            {user && (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="font-display text-xl font-[300] text-cyan hover:text-cyan-dark py-3.5 border-b border-gray-100 flex items-center justify-between transition-colors"
                  >
                    <span>Admin Dashboard</span>
                    <LayoutDashboard className="w-5 h-5 text-cyan" />
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="font-display text-xl font-[300] text-pink hover:text-pink-dark py-3.5 border-b border-gray-100 flex items-center justify-between transition-colors"
                >
                  <span>Manage Profile</span>
                  <User className="w-5 h-5 text-pink" />
                </Link>
              </>
            )}

            {user ? (
              <button
                onClick={async () => {
                  await logoutForClient();
                  localStorage.removeItem("rawflex-customer-profile");
                  setUser(null);
                  setOpen(false);
                  window.location.reload();
                }}
                className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-pink hover:bg-pink-dark text-white font-body font-semibold text-base shadow-sm transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-pink hover:bg-pink-dark text-white font-body font-semibold text-base shadow-sm transition-colors"
              >
                Login / Register
              </Link>
            )}

            <div className="mt-8 text-xs text-muted font-body">
              <p>{SITE.phone}</p>
              <p className="mt-1">{SITE.email}</p>
            </div>
          </nav>
        </div>
      </header>
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        shipping={shipping}
      />
    </>
  );
}
