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
  Heart,
  LogOut,
  LayoutDashboard,
  X,
  ArrowRight,
  Sparkles,
  Flame,
  Tag,
  Home,
  LayoutGrid,
  Phone,
  Mail,
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
  const { cartCount, isCartOpen, setIsCartOpen, openCart, closeCart, isCartBumping } = useCart();
  const [user, setUser] = useState<any>(null);
  const isAdmin = user && user.user_metadata?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showDesktopSearch, setShowDesktopSearch] = useState(false);
  const [shipping, setShipping] = useState<any>(null);
  const [navCategories, setNavCategories] = useState<any[]>(HEADER_CATEGORIES);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isHomeActive = pathname === "/";
  const isSearchActive = showDesktopSearch;
  const isShopActive =
    (pathname === "/shop" || pathname.startsWith("/shop/")) && !showDesktopSearch;
  const isWishlistActive = pathname === "/wishlist";
  const isProfileActive = pathname === "/profile" || pathname === "/login";

  useEffect(() => {
    const fetchActiveCategories = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("categories")
          .select("id, name, slug, is_active")
          .eq("is_active", true)
          .order("name");

        if (data && data.length > 0) {
          setNavCategories(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              href: `/shop?category=${c.slug || c.id}`,
            }))
          );
        }
      } catch (err) {
        // fallback to HEADER_CATEGORIES
      }
    };
    fetchActiveCategories();
  }, []);

  useEffect(() => {
    const updateWishlistCount = () => {
      try {
        const saved = localStorage.getItem("teenzos_wishlist");
        if (saved) {
          const parsed = JSON.parse(saved);
          setWishlistCount(Object.values(parsed).filter(Boolean).length);
        } else {
          setWishlistCount(0);
        }
      } catch {
        setWishlistCount(0);
      }
    };

    updateWishlistCount();
    window.addEventListener("teenzos-wishlist-change", updateWishlistCount);
    window.addEventListener("storage", updateWishlistCount);
    return () => {
      window.removeEventListener("teenzos-wishlist-change", updateWishlistCount);
      window.removeEventListener("storage", updateWishlistCount);
    };
  }, []);

  useEffect(() => {
    getShippingSettings()
      .then((data) => setShipping(data))
      .catch((err) =>
        console.error("Error loading header shipping settings:", err),
      );

    const handleVisibility = (e: any) => {
      if (typeof e.detail?.visible === 'boolean') {
        setAnnouncementVisible(e.detail.visible);
      }
    };
    window.addEventListener('teenzos-announcement-visibility', handleVisibility);
    return () => {
      window.removeEventListener('teenzos-announcement-visibility', handleVisibility);
    };
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
        className={`fixed ${announcementVisible ? "top-8 md:top-9" : "top-0"} inset-x-0 z-[99999] transition-all duration-300`}
      >
        {/* Top Header Bar with persistent bottom border & modern box shadow (visible even when mobile menu/navlinks are open) */}
        <div className="relative z-30 bg-white border-b border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
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
              <span className="font-display font-[500] text-base sm:text-lg md:text-xl lg:text-2xl tracking-[0.05em] text-ink group-hover:text-pink transition-colors">
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
                                  className="group/item flex items-center justify-between py-1 text-[13px] border-b-[1.5px] border-gray-400/50 font-semibold text-ink/80 hover:text-pink transition-all  hover:border-pink"
                                >
                                  <span>{cat.name}</span>
                                  <ArrowRight className="w-3 h-3 text-pink opacity-70 group-hover/item:opacity-100 transition-all" />
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
                                href="/shop"
                                className="group/card block rounded-[5px] overflow-hidden border border-gray-200 hover:border-[#F72585] hover:shadow-lg transition-all duration-300 bg-white"
                              >
                                <div className="relative h-[150px] w-full bg-[#F5F5F5] overflow-hidden">
                                  <Image
                                    src="/images/Spotlight.png"
                                    alt="Explore Fresh Drops"
                                    fill
                                    unoptimized
                                    className="object-cover object-top group-hover/card:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-sm text-white text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                    NEW COLLECTION
                                  </div>
                                </div>
                                <div className="p-3 bg-white">
                                  <p className="font-display font-[350] text-sm text-[#0B0D0E] group-hover/card:text-[#F72585] transition-colors leading-tight truncate">
                                    Explore Fresh Drops
                                  </p>
                                  <div className="flex items-start flex-col justify-between mt-1.5">
                                    <span className="text-[11px] font-bold text-[#0B0D0E] group-hover/card:text-[#F72585] transition-colors">
                                      Explore All →
                                    </span>
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
                    className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-pink to-[#36B8C5] text-white text-[11px] font-black shadow-xs hover:scale-105 transition-transform"
                  >
                    {user?.full_name ? (
                      user.full_name.trim().slice(0, 1).toUpperCase()
                    ) : (
                      <User className="w-[17px] h-[17px]" />
                    )}
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                      } catch (err) {
                        console.error("Client signout error:", err);
                      }
                      try {
                        await logoutForClient();
                      } catch (err) {
                        console.error("Logout error:", err);
                      }
                      localStorage.removeItem("rawflex-customer-profile");
                      setUser(null);
                      window.location.href = "/login";
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

            {/* Wishlist Button */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              title="My Wishlist"
              className="relative text-ink hover:text-pink transition-colors shrink-0 p-1 rounded-full hover:bg-gray-100"
            >
              <Heart className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink text-white text-[9px] font-[300] rounded-full flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart Button */}
            <button
              data-cart-target="true"
              onClick={openCart}
              aria-label="Shopping Cart"
              title="Shopping Cart"
              className={`relative text-ink hover:text-pink transition-all shrink-0 p-1 rounded-full hover:bg-gray-100 ${
                isCartBumping ? "animate-cart-impact text-[#FF007A]" : ""
              }`}
            >
              {/* Shockwave Ripple Ring */}
              {isCartBumping && (
                <span className="absolute inset-0 rounded-full border-2 border-[#FF007A] animate-cart-ripple pointer-events-none" />
              )}
              <ShoppingBag className="w-[19px] h-[19px] md:w-[21px] md:h-[21px]" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-4 h-4 bg-pink text-white text-[9px] font-[300] rounded-full flex items-center justify-center shadow-sm ${
                    isCartBumping ? "animate-badge-pop ring-2 ring-[#FF007A]/60" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Right Action — ONLY Cart Icon */}
          <div className="lg:hidden flex items-center justify-end">
            <button
              data-cart-target="true"
              onClick={openCart}
              aria-label="Shopping Cart"
              className={`relative h-10 w-10 flex items-center justify-center rounded-full text-ink hover:text-pink active:scale-90 hover:bg-gray-100 transition-all shrink-0 ${
                isCartBumping ? "animate-cart-impact text-[#FF007A]" : ""
              }`}
              title="Shopping Cart"
            >
              {/* Shockwave Ripple Ring */}
              {isCartBumping && (
                <span className="absolute inset-0 rounded-full border-2 border-[#FF007A] animate-cart-ripple pointer-events-none" />
              )}
              <ShoppingBag className="w-[21px] h-[21px]" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-pink text-white text-[9.5px] font-bold rounded-full flex items-center justify-center shadow-sm ring-2 ring-white ${
                    isCartBumping ? "animate-badge-pop ring-2 ring-[#FF007A]/60" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
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
          className={`lg:hidden fixed inset-x-0 ${announcementVisible ? "top-[98px] md:top-[112px]" : "top-[66px] md:top-[76px]"} bottom-0 bg-white z-20 overflow-y-auto transition-all duration-300 ${
            open
              ? "block opacity-100 pointer-events-auto"
              : "hidden opacity-0 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col px-6 pt-6 pb-10 gap-1">
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
                      className="w-full flex items-center justify-between font-display text-[20px] font-[280] text-ink text-left hover:text-pink transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        {link.label}
                        <span className="text-[12px] font-extrabold uppercase tracking-wider text-pink bg-pink-soft px-2 py-0.5 rounded-full font-body">
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
                              href="/shop"
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:border-pink transition-colors"
                            >
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-gray-100">
                                <Image
                                  src="/images/Spotlight.png"
                                  alt="Explore Fresh Drops"
                                  fill
                                  unoptimized
                                  className="object-cover object-center"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-display font-[280] text-xs text-ink truncate">
                                  Explore Fresh Drops
                                </p>
                                <p className="text-[11px] font-medium text-pink mt-0.5">Explore All &rarr;</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-pink shrink-0 mr-1" />
                            </Link>
                          </div>

                          <Link
                            href="/shop"
                            onClick={() => setOpen(false)}
                            className="mt-2 text-center py-1.5 rounded-[5px] border border-pink text-pink font-[300] text-sm hover:bg-pink hover:text-white transition-colors"
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
                  className="font-display text-[18px] font-[280] text-ink hover:text-pink py-3 border-b border-gray-100 transition-colors"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="font-display text-xl font-[300] text-ink hover:text-pink py-3.5 border-b border-gray-100 flex items-center justify-between transition-colors"
            >
              <span>My Wishlist</span>
              <div className="flex items-center gap-2">
                {wishlistCount > 0 && (
                  <span className="bg-[#FFE1ED] text-[#F72585] text-xs font-black px-2.5 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
                <Heart className="w-5 h-5 text-pink" />
              </div>
            </Link>

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
                  try {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                  } catch (err) {
                    console.error("Client signout error:", err);
                  }
                  try {
                    await logoutForClient();
                  } catch (err) {
                    console.error("Logout error:", err);
                  }
                  localStorage.removeItem("rawflex-customer-profile");
                  setUser(null);
                  setOpen(false);
                  window.location.href = "/login";
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

            {/* Quick Contact Info with Modern Compact Icon Buttons */}
            <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center gap-2">
              <a
                href={`tel:${SITE.phoneHref}`}
                className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50/90 hover:bg-pink-soft text-ink hover:text-pink transition-all border border-gray-100 active:scale-95 group/call overflow-hidden"
                title={`Call ${SITE.phone}`}
              >
                <div className="w-6 h-6 rounded-full bg-pink/10 flex items-center justify-center text-pink shrink-0 group-hover/call:bg-pink group-hover/call:text-white transition-colors">
                  <Phone className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold truncate tracking-tight">{SITE.phone}</span>
              </a>

              <a
                href={`mailto:${SITE.email}`}
                className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50/90 hover:bg-pink-soft text-ink hover:text-pink transition-all border border-gray-100 active:scale-95 group/mail overflow-hidden"
                title={`Email ${SITE.email}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#36B8C5]/10 flex items-center justify-center text-[#36B8C5] shrink-0 group-hover/mail:bg-[#36B8C5] group-hover/mail:text-white transition-colors">
                  <Mail className="w-3 h-3 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold truncate tracking-tight">{SITE.email}</span>
              </a>
            </div>

          </nav>
        </div>
      </header>

      {/* Modern Mobile Bottom Navigation Bar (Visible only on mobile) */}
      {!open && !pathname?.startsWith("/admin") && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-[9990] bg-white/95 backdrop-blur-xl border-t border-gray-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]"
        >
          <div className="max-w-md mx-auto grid grid-cols-5 items-center">
            {/* 1. Home */}
            <Link
              href="/"
              aria-label="Home"
              className={`group flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isHomeActive ? "text-pink" : "text-gray-500 hover:text-ink"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Home
                  className={`w-[21px] h-[21px] transition-transform duration-200 ${
                    isHomeActive ? "scale-110 stroke-[2.4]" : "stroke-[1.9] group-hover:scale-105"
                  }`}
                />
                {isHomeActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-pink shadow-xs" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-tight select-none ${
                  isHomeActive ? "font-bold text-pink" : "font-medium"
                }`}
              >
                Home
              </span>
            </Link>

            {/* 2. Search */}
            <button
              type="button"
              onClick={() => setShowDesktopSearch(true)}
              aria-label="Search"
              className={`group flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isSearchActive ? "text-pink" : "text-gray-500 hover:text-ink"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Search
                  className={`w-[21px] h-[21px] transition-transform duration-200 ${
                    isSearchActive ? "scale-110 stroke-[2.4]" : "stroke-[1.9] group-hover:scale-105"
                  }`}
                />
                {isSearchActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-pink shadow-xs" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-tight select-none ${
                  isSearchActive ? "font-bold text-pink" : "font-medium"
                }`}
              >
                Search
              </span>
            </button>

            {/* 3. Shop */}
            <Link
              href="/shop"
              aria-label="Shop"
              className={`group flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isShopActive ? "text-pink" : "text-gray-500 hover:text-ink"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <LayoutGrid
                  className={`w-[21px] h-[21px] transition-transform duration-200 ${
                    isShopActive ? "scale-110 stroke-[2.4]" : "stroke-[1.9] group-hover:scale-105"
                  }`}
                />
                {isShopActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-pink shadow-xs" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-tight select-none ${
                  isShopActive ? "font-bold text-pink" : "font-medium"
                }`}
              >
                Shop
              </span>
            </Link>

            {/* 4. Wishlist */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className={`group flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isWishlistActive ? "text-pink" : "text-gray-500 hover:text-ink"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Heart
                  className={`w-[21px] h-[21px] transition-transform duration-200 ${
                    isWishlistActive
                      ? "scale-110 stroke-[2.4] fill-pink text-pink"
                      : "stroke-[1.9] group-hover:scale-105"
                  }`}
                />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-pink text-white text-[9px] font-bold flex items-center justify-center shadow-xs ring-1 ring-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
                {isWishlistActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-pink shadow-xs" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-tight select-none ${
                  isWishlistActive ? "font-bold text-pink" : "font-medium"
                }`}
              >
                Wishlist
              </span>
            </Link>

            {/* 5. Person / Profile */}
            <Link
              href={user ? "/profile" : "/login"}
              aria-label="Profile"
              className={`group flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isProfileActive ? "text-pink" : "text-gray-500 hover:text-ink"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {user?.full_name ? (
                  <div
                    className={`w-[21px] h-[21px] rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                      isProfileActive
                        ? "bg-pink ring-2 ring-pink/30"
                        : "bg-gradient-to-tr from-pink to-[#36B8C5]"
                    }`}
                  >
                    {user.full_name.trim().slice(0, 1).toUpperCase()}
                  </div>
                ) : (
                  <User
                    className={`w-[21px] h-[21px] transition-transform duration-200 ${
                      isProfileActive ? "scale-110 stroke-[2.4]" : "stroke-[1.9] group-hover:scale-105"
                    }`}
                  />
                )}
                {isProfileActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-pink shadow-xs" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 leading-tight select-none ${
                  isProfileActive ? "font-bold text-pink" : "font-medium"
                }`}
              >
                {user ? "Profile" : "Account"}
              </span>
            </Link>
          </div>
        </nav>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={closeCart}
        shipping={shipping}
      />
    </>
  );
}
