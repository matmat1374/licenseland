"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, LogOut, ShieldCheck, User, ChevronLeft } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full" aria-label="منو">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-right">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                L
              </div>
              <span className="text-lg font-extrabold">{SITE.name}</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-accent",
                pathname === link.href && "bg-accent text-primary"
              )}
            >
              {link.label}
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t p-4">
          {session?.user ? (
            <div className="flex flex-col gap-2">
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-accent p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{session.user.name || session.user.email}</div>
                  <div className="text-xs text-muted-foreground">حساب کاربری</div>
                </div>
              </div>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <LayoutDashboard className="ml-2 h-4 w-4" /> پنل کاربری
                </Link>
              </Button>
              {session.user.role === "ADMIN" && (
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <ShieldCheck className="ml-2 h-4 w-4" /> پنل مدیریت
                  </Link>
                </Button>
              )}
              <Button variant="ghost" className="justify-start text-rose-500" onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }}>
                <LogOut className="ml-2 h-4 w-4" /> خروج
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/login" onClick={() => setOpen(false)}>ورود / ثبت‌نام</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
