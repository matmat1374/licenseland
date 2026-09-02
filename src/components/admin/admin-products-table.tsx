"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Package, Search, ExternalLink } from "lucide-react";
import { toFa } from "@/lib/date";
import { toToman, calcDiscountPercent } from "@/lib/format";
import { ProductManager } from "@/components/admin/product-manager";

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
  costUsd: number | null;
  markupPercent: number | null;
};

interface AdminProductsTableProps {
  products: ProductRow[];
  categories: { name: string; slug: string }[];
  activeUsdRate: number;
}

const ITEMS_PER_PAGE = 30;

export function AdminProductsTable({ products, categories, activeUsdRate }: AdminProductsTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter (persian title, english name if available, slug)
      const q = search.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);

      // Category filter
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = p.isActive;
      if (statusFilter === "inactive") matchesStatus = !p.isActive;
      if (statusFilter === "in_stock") matchesStatus = p.stock > 0;
      if (statusFilter === "out_of_stock") matchesStatus = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  
  // Ensure current page is valid after filtering
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  } else if (totalPages === 0 && currentPage !== 1) {
    setCurrentPage(1);
  }

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-card p-3 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="جستجو در عنوان یا شناسه (slug)..."
            className="pl-3 pr-9 h-9"
          />
        </div>
        
        <Select
          value={categoryFilter}
          onValueChange={(val) => {
            setCategoryFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 sm:w-48">
            <SelectValue placeholder="همه دسته‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه دسته‌ها</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-9 sm:w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="active">فعال</SelectItem>
            <SelectItem value="inactive">غیرفعال</SelectItem>
            <SelectItem value="in_stock">موجود</SelectItem>
            <SelectItem value="out_of_stock">ناموجود</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b">
            <tr className="text-right text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">محصول</th>
              <th className="px-4 py-3 font-medium">دسته</th>
              <th className="px-4 py-3 font-medium">قیمت</th>
              <th className="px-4 py-3 font-medium">موجودی</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => {
              const off = calcDiscountPercent(p.price, p.discountPrice);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Link href={`/product/${p.slug}`} className="font-bold text-primary hover:underline flex items-center gap-1.5" target="_blank">
                        {p.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <div className="text-xs text-muted-foreground" dir="ltr">/{p.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{p.categoryName}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{toToman(p.discountPrice || p.price)} ت</div>
                    {p.discountPrice && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                        <span className="line-through text-muted-foreground">{toToman(p.price)}</span>
                        <span className="text-emerald-600 bg-emerald-500/10 px-1 rounded font-bold">
                          {toFa(off)}٪
                        </span>
                      </div>
                    )}
                    {(p.costUsd || p.markupPercent) && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 p-1.5 rounded-md border shadow-sm whitespace-nowrap">
                        <span>🧮</span>
                        <span>
                          فرمول: {p.costUsd ? `${p.costUsd}$` : '?$'} × {toFa(activeUsdRate.toLocaleString())} ت (تتر) 
                          {p.markupPercent ? ` + ${p.markupPercent}٪ سود` : ''} ➔ {toToman(p.price)} تومان
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        p.stock === 0
                          ? "border-rose-500/30 text-rose-600"
                          : p.stock <= 2
                          ? "border-amber-500/30 text-amber-600"
                          : "border-emerald-500/30 text-emerald-600"
                      }
                    >
                      {p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} عدد`}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 items-start">
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 text-[9px] px-1 h-4">
                            <Star className="h-2.5 w-2.5" /> ویژه
                          </Badge>
                        )}
                        {p.bestseller && (
                          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 text-[9px] px-1 h-4">
                            <Package className="h-2.5 w-2.5" /> پرفروش
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ProductManager
                      mode="edit"
                      product={p}
                      categories={categories}
                      activeUsdRate={activeUsdRate}
                    />
                  </td>
                </tr>
              );
            })}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  محصولی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            نمایش {(currentPage - 1) * ITEMS_PER_PAGE + 1} تا {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} از {toFa(filteredProducts.length)} محصول
          </div>
          <div className="flex gap-1" dir="ltr">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              قبلی
            </Button>
            <div className="flex items-center justify-center px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p - -1))}
              disabled={currentPage === totalPages}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
