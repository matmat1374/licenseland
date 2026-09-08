"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User, ShieldCheck, Menu, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/constants";
import * as Icons from "lucide-react";
import { useState } from "react";

export function MobileMenu() {
  const pathname = usePathname();
  const items = useCart((s: any) => s.items);
  const cartCount = items.reduce((acc: any, item: any) => acc + item.quantity, 0);
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/shop", label: "فروشگاه", icon: Search },
    { action: "menu", label: "دسته‌ها", icon: Menu },
    { href: "/cart", label: "سبد خرید", icon: ShoppingCart, badge: cartCount },
    { 
      href: session ? (isAdmin ? "/admin" : "/dashboard") : "/login", 
      label: session ? (isAdmin ? "مدیریت" : "پروفایل") : "ورود", 
      icon: isAdmin ? ShieldCheck : User 
    },
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"></div>
        
        <nav className="relative flex items-center justify-around px-2 py-3">
          {links.map((link, idx) => {
            if (link.action === "menu") {
              return (
                <button
                  key={idx}
                  onClick={() => setIsOpen(true)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 w-14 h-12 transition-all duration-300 text-muted-foreground hover:text-foreground outline-none"
                  )}
                >
                  <link.icon className="h-5 w-5" strokeWidth={2} />
                  <span className="text-[10px] font-medium">{link.label}</span>
                </button>
              );
            }

            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href!));
            return (
              <Link
                key={link.href}
                href={link.href!}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-14 h-12 transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <link.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-in zoom-in">
                      {link.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[10px] font-medium", isActive && "font-bold")}>{link.label}</span>
                {/* Active dot indicator */}
                {isActive && (
                  <span className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary animate-in fade-in zoom-in"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[300px] p-0 border-white/10 glass bg-background/95 backdrop-blur-xl">
          <SheetHeader className="p-6 text-right border-b border-white/5">
            <SheetTitle className="text-xl font-black text-right">دسته‌بندی‌ها</SheetTitle>
          </SheetHeader>
          <div className="p-4 grid gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = (Icons as any)[cat.icon || "Folder"] || Icons.Folder;
              return (
                <Link
                  key={cat.slug}
                  href={`/shop?cat=${cat.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm", cat.color || "from-primary to-primary/60")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">{cat.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
