import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LicenseManager } from "@/components/admin/license-manager";
import { KeyRound, Package } from "lucide-react";
import { toFa } from "@/lib/date";

export const metadata = { title: "مدیریت لایسنس‌ها" };

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const sp = await searchParams;
  const products = await db.product.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true, stock: true },
  });

  const selectedId = sp.productId || products[0]?.id || "";

  // counts per product (available + sold)
  let counts: Record<string, { available: number; sold: number; reserved: number; total: number }> = {};
  if (products.length > 0) {
    const grouped = await db.licenseKey.groupBy({
      by: ["productId", "status"],
      _count: { _all: true },
    });
    for (const g of grouped) {
      if (!counts[g.productId]) counts[g.productId] = { available: 0, sold: 0, reserved: 0, total: 0 };
      counts[g.productId].total += g._count._all;
      if (g.status === "AVAILABLE") counts[g.productId].available = g._count._all;
      else if (g.status === "SOLD") counts[g.productId].sold = g._count._all;
      else if (g.status === "RESERVED") counts[g.productId].reserved = g._count._all;
    }
  }

  // selected product licenses
  let licenses: Array<{
    id: string;
    key: string;
    note: string | null;
    status: string;
    source: string | null;
    createdAt: Date;
    soldAt: Date | null;
  }> = [];
  if (selectedId) {
    licenses = await db.licenseKey.findMany({
      where: { productId: selectedId },
      orderBy: { createdAt: "desc" },
      select: { id: true, key: true, note: true, status: true, source: true, createdAt: true, soldAt: true },
    });
  }

  const serializableProducts = products.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    stock: p.stock,
    counts: counts[p.id] || { available: 0, sold: 0, reserved: 0, total: 0 },
  }));

  const serializableLicenses = licenses.map((l) => ({
    id: l.id,
    key: l.key,
    note: l.note,
    status: l.status,
    source: l.source,
    createdAt: l.createdAt.toISOString(),
    soldAt: l.soldAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">مدیریت لایسنس‌ها</h1>
        <p className="text-sm text-muted-foreground">کلیدهای محصولات و موجودی انبار</p>
      </div>

      <LicenseManager
        products={serializableProducts}
        initialProductId={selectedId}
        licenses={serializableLicenses}
      />
    </div>
  );
}
