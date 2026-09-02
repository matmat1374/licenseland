"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { SearchDialog } from "./search-dialog";
import { MobileMenu } from "./mobile-menu";
import { useCart } from "@/store/cart";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { data: session } = useSession();
  const openCart = useCart((s) => s.open);
  const count = useCart((s) => s.count);
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cnt = mounted ? count() : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled ? "glass border-border shadow-sm" : "border-transparent bg-background"
      )}
    >
      {/* top promo banner */}
      <Link href="/shop" className="group block bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white hover:from-amber-400 hover:via-emerald-500 hover:to-teal-500 transition-all">
        <div className="container mx-auto flex h-9 items-center justify-center px-4 text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-2">
            <span className="text-base">🔥</span> 
            تضمین ارزانترین قیمت ایران در مقایسه با ترب | استعلام خودکار کمترین قیمت بازار + ۵٪ تخفیف خرید اول با کد: <span className="font-bold bg-white/20 px-2 py-0.5 rounded-md tracking-wider">LICENO</span>
          </span>
        </div>
      </Link>

      {/* main header */}
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <MobileMenu />

        {/* logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-500 to-teal-600 p-[1px] shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50 mix-blend-overlay blur-[2px]" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[15px] bg-background/90 backdrop-blur-xl">
              <div className="absolute inset-0 rounded-[15px] bg-gradient-to-tr from-emerald-500/10 to-amber-500/10" />
              <KeyRound className="h-6 w-6 rotate-45 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all group-hover:rotate-0" />
            </div>
          </div>
          <div className="hidden sm:block shrink-0">
            <div className="text-xl font-black tracking-tight text-foreground whitespace-nowrap">
              لایسـنـو
            </div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground whitespace-nowrap">
              LICENO <span className="text-emerald-500">•</span> LEGAL STORE
            </div>
          </div>
        </Link>

        {/* desktop nav */}
        <nav className="mr-2 hidden items-center gap-1 xl:gap-2 lg:flex shrink-0">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary whitespace-nowrap shrink-0 select-none",
                  active && "bg-accent text-primary font-bold"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* central search */}
        <div className="mr-auto ml-2 w-full max-w-sm flex-1 md:mx-4 lg:mx-8">
          <SearchDialog />
        </div>

        <div className="flex items-center gap-1 md:mr-0">
          <ThemeToggle />

          {/* cart - hidden on mobile (in bottom nav) */}
          <button
            onClick={openCart}
            aria-label="سبد خرید"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent md:flex"
          >
            <ShoppingCart className="h-5 w-5" />
            {cnt > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {cnt}
              </span>
            )}
          </button>

          {/* user - hidden on mobile */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-accent md:flex">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                      {session.user.name?.[0] || session.user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <div className="font-medium">{session.user.name || "کاربر"}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">{session.user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard"><LayoutDashboard className="ml-2 h-4 w-4" /> پنل کاربری</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard?tab=orders"><ShoppingCart className="ml-2 h-4 w-4" /> سفارش‌های من</Link>
                </DropdownMenuItem>
                {session.user.role === "ADMIN" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><ShieldCheck className="ml-2 h-4 w-4" /> پنل مدیریت</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut({ redirect: false });
                    window.location.href = "/";
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="mr-1 hidden gap-1.5 md:flex rounded-full">
              <Link href="/login">
                <UserIcon className="h-4 w-4" />
                <span>ورود / ثبت‌نام</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
