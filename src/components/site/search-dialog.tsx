"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductCover } from "./product-cover";
import { toToman } from "@/lib/format";
import Link from "next/link";

interface Suggestion {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  brand: string | null;
  shortDesc: string;
}

export function SearchDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function submit() {
    if (!q.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(q)}`);
    setOpen(false);
    setQ("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button
            aria-label="جستجو"
            className="flex h-10 items-center gap-2 rounded-full border border-border bg-background/60 px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground md:w-64"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">جستجوی محصول...</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>جستجوی محصول</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b p-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="نام محصول، برند یا دسته را جستجو کنید..."
            className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-base"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!loading && q && results.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              نتیجه‌ای یافت نشد. عبارت دیگری امتحان کنید.
            </div>
          )}
          {!loading && !q && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              برای جستجوی سریع محصولات، چیزی تایپ کنید.
            </div>
          )}
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent"
            >
              <ProductCover
                title={p.title}
                brand={p.brand}
                seed={p.slug}
                className="h-12 w-12 rounded-lg shrink-0"
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-medium">{p.title}</div>
                <div className="line-clamp-1 text-xs text-muted-foreground">{p.shortDesc}</div>
              </div>
              <div className="text-sm font-bold text-primary">
                {toToman(p.discountPrice ?? p.price)}
                <span className="mr-1 text-[10px] text-muted-foreground">تومان</span>
              </div>
            </Link>
          ))}
        </div>
        {q && (
          <div className="border-t p-2">
            <button
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              مشاهده همه نتایج برای «{q}»
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
