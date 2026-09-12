"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  ShieldCheck,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserNavMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
  };
  inAdmin?: boolean;
}

export function UserNavMenu({ user, inAdmin = false }: UserNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";

  const displayName = user.name?.trim() || user.phone || "کاربر گرامی";
  // Avatar text: if no name, show last 2 digits of phone, or email initial, or U
  const avatarText = user.name?.trim()
    ? user.name.trim()[0].toUpperCase()
    : user.phone
    ? user.phone.slice(-2)
    : (user.email?.[0] || "U").toUpperCase();

  const displaySubtitle = user.email && !user.email.endsWith("@liceno.ir")
    ? user.email
    : (user.phone || "");

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsOpen(false);
    await signOut({ redirect: false });
    window.location.href = "/";
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="حساب کاربری"
        className="flex items-center gap-1.5 rounded-full p-1 transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/20 select-none cursor-pointer"
      >
        <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/25 shadow-xs">
          <AvatarFallback className="bg-gradient-to-br from-primary/25 to-emerald-500/25 text-primary text-xs sm:text-sm font-black">
            {avatarText}
          </AvatarFallback>
        </Avatar>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          dir="rtl"
          className="absolute left-0 top-full mt-2 w-60 sm:w-64 rounded-2xl border border-border/80 bg-popover/98 backdrop-blur-md p-2 shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* User Info Header */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 mb-1 border border-border/40">
            <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary font-black text-sm">
                {avatarText}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {displayName}
                </span>
                {isAdmin && (
                  <Badge className="h-5 px-1.5 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    مدیر
                  </Badge>
                )}
              </div>
              {displaySubtitle && (
                <div className="text-[11px] text-muted-foreground truncate" dir="ltr">
                  {displaySubtitle}
                </div>
              )}
            </div>
          </div>

          <div className="my-1 border-t border-border/60" />

          {/* Navigation Links */}
          <div className="space-y-0.5 text-xs sm:text-sm">
            {isAdmin && !inAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-primary font-bold hover:bg-primary/10 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>پنل مدیریت</span>
              </Link>
            )}

            {inAdmin && (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
              >
                <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>مشاهده سایت</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>پنل کاربری</span>
            </Link>

            <Link
              href="/dashboard?tab=orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground font-medium hover:bg-muted transition-colors"
            >
              <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>سفارش‌های من</span>
            </Link>
          </div>

          <div className="my-1 border-t border-border/60" />

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive font-medium hover:bg-destructive/10 transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>خروج از حساب</span>
          </button>
        </div>
      )}
    </div>
  );
}
