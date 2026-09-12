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
import { NAV_LINKS, SITE, CATEGORIES } from "@/lib/constants";
import { usePathname, useRouter } from "next/navigation";
import * as LucideIcons from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";
import { UserNavMenu } from "./user-nav-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const openCart = useCart((s) => s.open);
  const count = useCart((s) => s.count);
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide public site header completely when inside admin panel
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const cnt = mounted ? count() : 0;

  return (
    <header
      className={cn(
        "relative md:sticky md:top-0 z-50 w-full border-b transition-all duration-300",
        scrolled ? "glass border-border shadow-sm" : "border-transparent bg-background"
      )}
    >
      {/* top promo banner */}
      <Link href="/shop" className="group block bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white hover:from-amber-400 hover:via-emerald-500 hover:to-teal-500 transition-all">
        <div className="container mx-auto flex h-8 sm:h-9 items-center justify-center px-2 sm:px-4 text-[11px] sm:text-xs md:text-sm font-medium">
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-sm">🔥</span> 
            <span className="sm:hidden font-bold">تضمین کمترین قیمت بازار + ۵٪ تخفیف اول با کد:</span>
            <span className="hidden sm:inline">تضمین ارزانترین قیمت در مقایسه با ترب | استعلام خودکار + ۵٪ تخفیف خرید اول با کد:</span>
            <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded tracking-wider text-[10px] sm:text-xs">LICENO</span>
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary outline-none whitespace-nowrap shrink-0 select-none">
                دسته‌بندی‌ها
                <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[560px] p-3 grid grid-cols-2 gap-2 rounded-xl shadow-xl border-white/10 bg-background/95 backdrop-blur-xl">
              {CATEGORIES.map((cat) => {
                const Icon = (LucideIcons as any)[cat.icon || "Folder"] || LucideIcons.Folder;
                return (
                  <DropdownMenuItem key={cat.slug} asChild className="cursor-pointer rounded-lg hover:bg-accent focus:bg-accent transition-colors p-2 outline-none">
                    <Link href={`/shop?cat=${cat.slug}`} className="flex items-center gap-3 w-full">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm shrink-0", cat.color || "from-primary to-primary/60")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-bold truncate">{cat.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{cat.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* central search */}
        <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4 lg:mx-6">
          <SearchDialog />
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />

          {/* cart */}
          <button
            onClick={openCart}
            aria-label="سبد خرید"
            className="relative flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-muted/40 hover:bg-muted px-2.5 sm:px-3 text-foreground transition-all shadow-sm group"
          >
            <ShoppingCart className="h-4 w-4 text-primary transition-transform group-hover:scale-110 shrink-0" />
            <span className="hidden xl:inline text-xs font-bold whitespace-nowrap">سبد خرید</span>
            {cnt > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground shadow-sm">
                {cnt}
              </span>
            )}
          </button>

          {/* user */}
          {session?.user ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm",
                  isAdmin 
                    ? "bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25"
                    : "bg-muted text-foreground border border-border hover:bg-accent"
                )}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>پنل مدیریت</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                    <span>پنل کاربری</span>
                  </>
                )}
              </Link>

              <UserNavMenu user={session.user} />
            </div>
          ) : (
            <Button asChild size="sm" className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full shrink-0 text-xs font-bold gap-1 shadow-sm">
              <Link href="/login">
                <UserIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ورود / ثبت‌نام</span>
                <span className="sm:hidden">ورود</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
