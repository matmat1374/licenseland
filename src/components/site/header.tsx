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
      {/* top bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="container mx-auto flex h-8 items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              تحویل آنی و خودکار لایسنس پس از پرداخت
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:underline">سوالات متداول</Link>
            <span className="opacity-50">|</span>
            <Link href="/contact" className="hover:underline">پشتیبانی ۲۴/۷</Link>
            <span className="opacity-50">|</span>
            <a href={SITE.telegram} target="_blank" rel="noreferrer" className="hover:underline">تلگرام</a>
          </div>
        </div>
      </div>

      {/* main header */}
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <MobileMenu />

        {/* logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground font-black shadow-lg shadow-primary/20">
            L
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold leading-none">{SITE.name}</div>
            <div className="text-[10px] text-muted-foreground">{SITE.tagline}</div>
          </div>
        </Link>

        {/* desktop nav */}
        <nav className="mr-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-primary",
                  active && "bg-accent text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* search */}
        <div className="mr-auto hidden md:block">
          <SearchDialog />
        </div>

        <div className="mr-auto flex items-center gap-1 md:mr-0">
          <ThemeToggle />

          {/* cart */}
          <button
            onClick={openCart}
            aria-label="سبد خرید"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
          >
            <ShoppingCart className="h-5 w-5" />
            {cnt > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {cnt}
              </span>
            )}
          </button>

          {/* user */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-accent">
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
                  className="text-rose-500 focus:text-rose-500"
                >
                  <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="mr-1 gap-1.5">
              <Link href="/login">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">ورود / ثبت‌نام</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
