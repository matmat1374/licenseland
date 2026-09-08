"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Package, Search, ExternalLink, RefreshCw, CheckCircle, List, LayoutGrid, Edit, Eye, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { toFa } from "@/lib/date";
import { toToman, calcDiscountPercent } from "@/lib/format";
import { ProductManager } from "@/components/admin/product-manager";
import { cn } from "@/lib/utils";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  category: string;
  categoryName: string;
  featured: boolean;
  bestseller: boolean;
  isActive: boolean;
  salesCount: number;
  createdAt: string;
  lastSyncedAt?: string | null;
  costUsd: number | null;
  markupPercent: number | null;
  rawCost: number;
  profitAmount: number;
  torobUrl: string | null;
};

interface AdminProductsTableProps {
  products: ProductRow[];
  categories: { name: string; slug: string }[];
  activeUsdRate: number;
  lastFullSyncAt?: string | null;
}

const ITEMS_PER_PAGE = 50;

export function AdminProductsTable({ products, categories, activeUsdRate, lastFullSyncAt }: AdminProductsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewMode, setViewMode] = useState<"standard" | "compact">("standard");

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = p.isActive;
      if (statusFilter === "inactive") matchesStatus = !p.isActive;
      if (statusFilter === "in_stock") matchesStatus = p.stock > 0;
      if (statusFilter === "out_of_stock") matchesStatus = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = result.sort((a, b) => {
      // ۱. اولویت اول: محصولات ناموجود همیشه باید در انتهای جدول قرار بگیرند
      const aInStock = a.stock > 0 ? 1 : 0;
      const bInStock = b.stock > 0 ? 1 : 0;
      if (aInStock !== bInStock) {
        return bInStock - aInStock; // موجودها اول (1)، ناموجودها آخر (0)
      }

      // ۲. اولویت دوم: سورت انتخابی کاربر
      switch (sortBy) {
        case "price-asc": return (a.discountPrice || a.price) - (b.discountPrice || b.price);
        case "price-desc": return (b.discountPrice || b.price) - (a.discountPrice || a.price);
        case "stock-asc": return a.stock - b.stock;
        case "name-asc": return a.title.localeCompare(b.title, 'fa');
        case "sales-desc": return b.salesCount - a.salesCount;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  } else if (totalPages === 0 && currentPage !== 1) {
    setCurrentPage(1);
  }

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    categories.forEach(c => counts[c.slug] = 0);
    products.forEach(p => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });
    return counts;
  }, [products, categories]);

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        <button
          onClick={() => { setCategoryFilter("all"); setCurrentPage(1); }}
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
            categoryFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          همه
          <Badge variant={categoryFilter === "all" ? "secondary" : "outline"} className={cn("ml-1 px-1.5 py-0", categoryFilter === "all" ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : "")}>
            {toFa(catCounts.all)}
          </Badge>
        </button>
        {categories.map(c => (
          <button
            key={c.slug}
            onClick={() => { setCategoryFilter(c.slug); setCurrentPage(1); }}
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              categoryFilter === c.slug ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {c.name}
            <Badge variant={categoryFilter === c.slug ? "secondary" : "outline"} className={cn("ml-1 px-1.5 py-0", categoryFilter === c.slug ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : "")}>
              {toFa(catCounts[c.slug] || 0)}
            </Badge>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5">
            {[
              { id: "all", label: "همه وضعیت‌ها" },
              { id: "in_stock", label: "موجود" },
              { id: "out_of_stock", label: "ناموجود" },
              { id: "active", label: "فعال" },
              { id: "inactive", label: "غیرفعال" }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => { setStatusFilter(status.id); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                  statusFilter === status.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو در محصول..."
              className="pl-3 pr-9 h-9"
            />
          </div>
        
          <Select
            value={sortBy}
            onValueChange={(val) => {
              setSortBy(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[130px]">
              <SelectValue placeholder="مرتب‌سازی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">جدیدترین</SelectItem>
              <SelectItem value="price-asc">ارزان‌ترین</SelectItem>
              <SelectItem value="price-desc">گران‌ترین</SelectItem>
              <SelectItem value="stock-asc">موجودی (کم به زیاد)</SelectItem>
              <SelectItem value="name-asc">الفبا (الف - ی)</SelectItem>
              <SelectItem value="sales-desc">پرفروش‌ترین</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 rounded-sm", viewMode === "standard" ? "bg-background shadow-sm" : "")}
              onClick={() => setViewMode("standard")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 rounded-sm", viewMode === "compact" ? "bg-background shadow-sm" : "")}
              onClick={() => setViewMode("compact")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr className="text-right text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">محصول</th>
              <th className="px-4 py-3 font-medium">قیمت</th>
              <th className="px-4 py-3 font-medium">موجودی</th>
              {viewMode === "standard" && (
                <>
                  <th className="px-4 py-3 font-medium">آخرین سینک</th>
                </>
              )}
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => {
              const off = calcDiscountPercent(p.price, p.discountPrice);
              const paddingClass = viewMode === "compact" ? "py-2" : "py-4";
              return (
                <tr key={p.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", p.stock === 0 && 'bg-rose-500/5', !p.isActive && 'bg-muted/30 opacity-60')}>
                  <td className={cn("px-4", paddingClass)}>
                    <div className="flex items-start gap-3">
                      <div className={cn("rounded-md bg-muted flex items-center justify-center flex-shrink-0 border", viewMode === "compact" ? "w-10 h-10" : "w-12 h-12")}>
                        <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <Link href={`/product/${p.slug}`} className="font-bold text-primary hover:underline truncate" target="_blank">
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.shortDesc && (
                            <div className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded" dir="ltr">{p.shortDesc}</div>
                          )}
                          <div className="text-[11px] text-muted-foreground" dir="ltr">/{p.slug}</div>
                          <Badge variant="secondary" className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0">
                            {p.categoryName}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4", paddingClass)}>
                    <div className="flex flex-col gap-2 items-start">
                      <div className="flex items-baseline gap-1">
                        <span className={cn("font-black tracking-tight text-foreground", viewMode === "compact" ? "text-sm" : "text-base")}>
                          {toFa(toToman(p.discountPrice || p.price))}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">تومان</span>
                        {p.discountPrice && (
                          <span className="mr-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.2 rounded">
                            {toFa(off)}٪-
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 p-2 bg-muted/60 rounded-lg border border-border/80 text-[11px] w-full min-w-[190px]">
                        <div className="flex justify-between items-center text-muted-foreground font-mono">
                          <span>قیمت دلار:</span>
                          <span className="font-bold text-foreground" dir="ltr">${p.costUsd || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>نرخ تتر:</span>
                          <span className="font-medium text-foreground">{toFa(toToman(activeUsdRate))} ت</span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                          <span>قیمت خام:</span>
                          <span className="font-bold text-foreground">{toFa(toToman(p.rawCost || (p.costUsd || 0) * activeUsdRate))} ت</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 font-medium">
                          <span>حاشیه سود:</span>
                          <span>+{toFa(p.markupPercent || 20)}٪ <span className="text-[10px] text-muted-foreground">({toFa(toToman(p.profitAmount || 0))} ت)</span></span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border/60 font-black text-primary">
                          <span>فروش نهایی:</span>
                          <span>{toFa(toToman(p.price))} ت</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4", paddingClass)}>
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{toFa(p.stock)} عدد</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>ناموجود</span>
                      </span>
                    )}
                  </td>
                  {viewMode === "standard" && (
                    <td className={cn("px-4 text-xs text-muted-foreground", paddingClass)}>
                      {p.lastSyncedAt 
                        ? new Date(p.lastSyncedAt).toLocaleString('fa-IR') 
                        : '—'}
                    </td>
                  )}
                  <td className={cn("px-4", paddingClass)}>
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge variant={p.isActive ? "default" : "secondary"} className="text-[11px] font-medium px-2 py-0.5">
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <span className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-500/10 border border-amber-500/20 text-[9px] px-1.5 py-0.2 rounded font-bold">
                            <Star className="h-2.5 w-2.5 fill-amber-500" /> ویژه
                          </span>
                        )}
                        {p.bestseller && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 text-[9px] px-1.5 py-0.2 rounded font-bold">
                            <Package className="h-2.5 w-2.5" /> پرفروش
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={cn("px-4", paddingClass)}>
                    <div className="flex items-center gap-2">
                      <ProductManager
                        mode="edit"
                        product={p}
                        categories={categories}
                        activeUsdRate={activeUsdRate}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </ProductManager>
                      <Link href={`/product/${p.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={viewMode === "standard" ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">
                  محصولی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-muted-foreground">
          نمایش {toFa(filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1)} تا {toFa(Math.min(currentPage * itemsPerPage, filteredProducts.length))} از {toFa(filteredProducts.length)} محصول
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">تعداد در صفحه:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">۲۵</SelectItem>
                <SelectItem value="50">۵۰</SelectItem>
                <SelectItem value="100">۱۰۰</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {totalPages > 1 && (
            <div className="flex gap-1" dir="ltr">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                قبلی
              </Button>
              <div className="flex items-center justify-center px-3 text-xs font-medium">
                {toFa(currentPage)} / {toFa(totalPages)}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                بعدی
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
