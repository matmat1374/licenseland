"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ProductFilters({ totalCount }: { totalCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const cat = params.get("cat") || "all";
  const sort = params.get("sort") || "newest";
  const search = params.get("search") || "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all" || (key === "sort" && value === "newest")) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجوی محصول..."
          defaultValue={search}
          onChange={(e) => update("search", e.target.value)}
          className="pr-9"
        />
        {search && (
          <button
            onClick={() => update("search", "")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* category pills */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <CategoryPill active={cat === "all"} onClick={() => update("cat", "all")}>
          همه
        </CategoryPill>
        {CATEGORIES.map((c) => (
          <CategoryPill key={c.slug} active={cat === c.slug} onClick={() => update("cat", c.slug)}>
            {c.name}
          </CategoryPill>
        ))}
      </div>

      {/* sort + count */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {totalCount} محصول یافت شد
        </span>
        <Select value={sort} onValueChange={(v) => update("sort", v)}>
          <SelectTrigger className="w-44">
            <SlidersHorizontal className="ml-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">جدیدترین</SelectItem>
            <SelectItem value="popular">پرفروش‌ترین</SelectItem>
            <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
            <SelectItem value="price-desc">گران‌ترین</SelectItem>
            <SelectItem value="discount">بیشترین تخفیف</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:border-primary/50 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}
