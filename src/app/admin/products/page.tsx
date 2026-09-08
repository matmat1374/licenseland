import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Package, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { toFa } from "@/lib/date";
import { ProductManager } from "@/components/admin/product-manager";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { SupplierSyncCard } from "@/components/admin/supplier-sync-card";
import { getUsdToTomanRate } from "@/lib/supplier";

export const metadata = { title: "مدیریت محصولات" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories, activeUsdRate, lastSyncSetting, syncIntervalSetting, globalMarkupSetting] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDesc: true,
        price: true,
        discountPrice: true,
        stock: true,
        category: true,
        featured: true,
        bestseller: true,
        isActive: true,
        salesCount: true,
        createdAt: true,
        specifications: true,
        lastSyncedAt: true,
      },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getUsdToTomanRate(),
    db.setting.findUnique({ where: { key: "last_full_sync_at" } }),
    db.setting.findUnique({ where: { key: "supplier_sync_interval" } }),
    db.setting.findUnique({ where: { key: "supplier_markup_percent" } }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.name]));
  const lastFullSyncAt = lastSyncSetting?.value ?? null;
  const initialInterval = syncIntervalSetting?.value ?? "disabled";
  const globalMarkup = globalMarkupSetting ? Number(globalMarkupSetting.value) : null;

  const serializable = products.map((p) => {
    let costUsd: number | null = null;
    let markupPercent = 20;
    let torobUrl: string | null = null;
    if (p.specifications) {
      try {
        const spec = typeof p.specifications === 'string' ? JSON.parse(p.specifications) : p.specifications;
        if (spec.price_usd) costUsd = parseFloat(spec.price_usd);
        else if (spec.cost_usd) costUsd = parseFloat(spec.cost_usd);
        
        if (spec.custom_markup !== undefined && spec.custom_markup !== null && spec.custom_markup !== "") {
          markupPercent = parseFloat(spec.custom_markup);
        } else if (globalMarkup !== null && !isNaN(globalMarkup)) {
          markupPercent = globalMarkup;
        } else if (costUsd) {
          if (costUsd < 10) markupPercent = 50;
          else if (costUsd <= 20) markupPercent = 30;
          else markupPercent = 20;
        }

        if (spec.torob_url) torobUrl = spec.torob_url;
      } catch (e) {}
    }
    if (!costUsd || isNaN(costUsd)) {
      const rate = activeUsdRate > 1000 ? activeUsdRate : 220000;
      const marginMultiplier = 1 + (markupPercent / 100);
      costUsd = parseFloat(((p.price / rate) / marginMultiplier).toFixed(2));
      if (costUsd <= 0) costUsd = parseFloat((p.price / rate).toFixed(2));
    }

    const rawCost = Math.round(costUsd * activeUsdRate);
    const profitAmount = Math.ceil((rawCost * (markupPercent / 100)) / 1000) * 1000;

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDesc: p.shortDesc,
      price: p.price,
      discountPrice: p.discountPrice,
      stock: p.stock,
      category: p.category,
      categoryName: catMap.get(p.category) || p.category,
      featured: p.featured,
      bestseller: p.bestseller,
      isActive: p.isActive,
      salesCount: p.salesCount,
      createdAt: p.createdAt.toISOString(),
      lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null,
      costUsd,
      markupPercent,
      rawCost,
      profitAmount,
      torobUrl,
    };
  });

  const cats = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت محصولات</h1>
          <p className="text-sm text-muted-foreground">
            مجموع {toFa(products.length)} محصول
          </p>
        </div>
        <ProductManager mode="create" categories={cats} activeUsdRate={activeUsdRate}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            افزودن محصول
          </Button>
        </ProductManager>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <div className="text-2xl font-black">{toFa(products.length)}</div>
              <div className="text-xs text-muted-foreground">کل محصولات</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <div className="text-2xl font-black">{toFa(products.filter(p => p.isActive).length)}</div>
              <div className="text-xs text-muted-foreground">محصولات فعال</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10"><AlertTriangle className="h-5 w-5 text-rose-500" /></div>
            <div>
              <div className="text-2xl font-black">{toFa(products.filter(p => p.stock === 0).length)}</div>
              <div className="text-xs text-muted-foreground">ناموجود</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
            <div>
              <div className="text-2xl font-black text-blue-600">{toFa(activeUsdRate)} <span className="text-xs font-normal text-muted-foreground">تومان</span></div>
              <div className="text-xs text-muted-foreground">نرخ تتر فعلی</div>
            </div>
          </div>
        </Card>
      </div>

      <SupplierSyncCard lastFullSyncAt={lastFullSyncAt} initialInterval={initialInterval} />

      <AdminProductsTable products={serializable} categories={cats} activeUsdRate={activeUsdRate} lastFullSyncAt={lastFullSyncAt} />
    </div>
  );
}
