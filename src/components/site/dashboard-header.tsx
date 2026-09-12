"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success("با موفقیت خارج شدید");
      window.location.href = "/";
    } catch {
      toast.error("خطا در خروج از حساب");
      setLoggingOut(false);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">پنل کاربری</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          خوش آمدید، <span className="font-semibold text-foreground">{userName}</span> 👋
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <Button asChild className="gap-1.5 shadow-sm">
          <Link href="/shop">
            <ShoppingBag className="h-4 w-4" />
            <span>خرید لایسنس جدید</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
          className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>خروج</span>
        </Button>
      </div>
    </div>
  );
}
