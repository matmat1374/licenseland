"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  KeyRound,
  ShoppingCart,
  FileText,
  BadgePercent,
  Settings,
  Menu,
  Home,
  LogOut,
  ShieldCheck,
  Truck,
  FileEdit,
  BookOpen,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE } from "@/lib/constants";

const NAV = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard, exact: true },
  { href: "/admin/setup", label: "راه‌اندازی اولیه", icon: Rocket },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/licenses", label: "لایسنس‌ها", icon: KeyRound },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingCart },
  { href: "/admin/supplier", label: "تأمین‌کننده", icon: Truck },
  { href: "/admin/content", label: "مدیریت محتوا", icon: FileEdit },
  { href: "/admin/articles", label: "مقالات", icon: FileText },
  { href: "/admin/discounts", label: "کدهای تخفیف", icon: BadgePercent },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
  { href: "/admin/docs", label: "راهنما", icon: BookOpen },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 font-black text-primary-foreground shadow-lg shadow-primary/20">
        L
      </div>
      <div className="leading-none">
        <div className="text-sm font-extrabold">{SITE.name}</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">پنل مدیریت</div>
      </div>
    </Link>
  );
}

function UserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-accent">
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {session.user.name?.[0] || session.user.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">
          <div className="font-medium">{session.user.name || "مدیر"}</div>
          <div className="truncate text-xs font-normal text-muted-foreground">
            {session.user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <Home className="ml-2 h-4 w-4" /> مشاهده سایت
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }}
          className="text-rose-500 focus:text-rose-500"
        >
          <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l bg-sidebar/80 backdrop-blur lg:flex">
        <Logo />
        <div className="mt-2 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t p-3">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <Link href="/">
              <Home className="h-4 w-4" /> بازگشت به سایت
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">منوی مدیریت</SheetTitle>
              <Logo />
              <div className="flex h-[calc(100%-64px)] flex-col">
                <div className="flex-1 overflow-y-auto">
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
                <div className="border-t p-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground"
                  >
                    <Link href="/" onClick={() => setOpen(false)}>
                      <Home className="h-4 w-4" /> بازگشت به سایت
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600 text-sm font-black text-primary-foreground">
              L
            </div>
            <span className="text-sm font-bold">پنل مدیریت</span>
          </div>

          <div className="mr-auto hidden items-center gap-2 lg:flex">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              دسترسی مدیر
            </div>
          </div>

          <div className="mr-auto flex items-center gap-1 lg:mr-0">
            <Button asChild variant="ghost" size="icon" aria-label="بازگشت به سایت">
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
