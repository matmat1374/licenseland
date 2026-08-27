"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useSession } from "next-auth/react";

export function MobileMenu() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const { data: session } = useSession();

  const links = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/shop", label: "جستجو", icon: Search },
    { href: "/cart", label: "سبد خرید", icon: ShoppingCart, badge: cartCount },
    { href: session ? "/dashboard" : "/login", label: session ? "پروفایل" : "ورود", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"></div>
      
      <nav className="relative flex items-center justify-around px-2 py-3">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all duration-300",
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
  );
}
