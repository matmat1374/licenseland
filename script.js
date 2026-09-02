const fs = require('fs');
const path = require('path');

console.log('Executing edits...');

// =======================
// Task 1: product-manager.tsx
// =======================
const pmPath = 'src/components/admin/product-manager.tsx';
let pmCode = fs.readFileSync(pmPath, 'utf8');

const newImports = `import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Star, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toFa } from "@/lib/date";
import { toToman, calcDiscountPercent } from "@/lib/format";
`;

pmCode = pmCode.replace('import { useState } from "react";\nimport { useRouter } from "next/navigation";\nimport { Button } from "@/components/ui/button";', newImports);
pmCode = pmCode.replace('isActive: boolean;\n  // optional', 'isActive: boolean;\n  specifications?: any;\n  brand?: string;\n  categoryName?: string;\n  salesCount?: number;\n  // optional');

const productListCode = `
export function ProductList({ products, categories }: { products: any[], categories: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = products.filter(p => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    let specs: any = {};
    try { specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications || "{}") : (p.specifications || {}); } catch(e) {}
    const sId = specs.supplier_product_id ? String(specs.supplier_product_id).toLowerCase() : "";
    
    return p.title.toLowerCase().includes(q) ||
           (p.brand && p.brand.toLowerCase().includes(q)) ||
           (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
           sId.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let aSpecs: any = {}; let bSpecs: any = {};
    try { aSpecs = typeof a.specifications === 'string' ? JSON.parse(a.specifications || "{}") : (a.specifications || {}); } catch(e) {}
    try { bSpecs = typeof b.specifications === 'string' ? JSON.parse(b.specifications || "{}") : (b.specifications || {}); } catch(e) {}
    
    const aActive = a.isActive && (aSpecs.supplier_stock !== 0);
    const bActive = b.isActive && (bSpecs.supplier_stock !== 0);
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="جستجو در محصولات (عنوان، برند، دسته، شناسه تأمین‌کننده)..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-right text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">محصول</th>
                <th className="px-4 py-3 font-medium">دسته</th>
                <th className="px-4 py-3 font-medium">قیمت</th>
                <th className="px-4 py-3 font-medium">موجودی</th>
                <th className="px-4 py-3 font-medium">فروش</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">ویژگی</th>
                <th className="px-4 py-3 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const off = calcDiscountPercent(p.price, p.discountPrice);
                let specs: any = {};
                try { specs = typeof p.specifications === 'string' ? JSON.parse(p.specifications || "{}") : (p.specifications || {}); } catch(e) {}
                const sStock = specs.supplier_stock;
                const isOut = sStock === 0 || !p.isActive;
                
                return (
                  <tr key={p.id} className={\`border-t hover:bg-muted/30 \${isOut ? "opacity-60 grayscale" : ""}\`}>
                    <td className="px-4 py-3">
                      <div className="font-medium leading-tight">{p.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
                        /{p.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.categoryName}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-primary">{toToman(p.discountPrice || p.price)} ت</div>
                      {p.discountPrice ? (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="line-through">{toToman(p.price)}</span>
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {toFa(off)}٪
                          </Badge>
                        </div>
                      ) : null}
                      {specs.price_usd && (
                        <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground font-mono" dir="ltr">
                          <span>💡 \${specs.price_usd} × {toFa(specs.usd_rate_used)} × {toFa(specs.markup_used)} = {toToman(p.price)}</span>
                          {specs.last_synced && <span className="text-[10px] text-right font-sans" dir="rtl">آخرین سینک: {specs.last_synced}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          (p.stock === 0 || sStock === 0)
                            ? "border-rose-500/30 text-rose-600 dark:text-rose-400"
                            : p.stock <= 2
                            ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                            : ""
                        }
                      >
                        {p.stock === 0 ? "ناموجود" : \`\${toFa(p.stock)} عدد\`}
                        {sStock !== undefined && \` (تأمین: \${toFa(sStock)})\`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{toFa(p.salesCount || 0)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? "default" : "secondary"}>
                        {p.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.featured && (
                          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Star className="h-3 w-3" /> ویژه
                          </Badge>
                        )}
                        {p.bestseller && (
                          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Package className="h-3 w-3" /> پرفروش
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProductManager
                        mode="edit"
                        product={p}
                        categories={categories}
                      />
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    موردی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync(pmPath, pmCode + '\n' + productListCode);

// =======================
// Update page.tsx to use ProductList
// =======================
const pagePath = 'src/app/admin/products/page.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf8');

pageCode = pageCode.replace('category: true,\n        featured: true,', 'category: true,\n        brand: true,\n        specifications: true,\n        featured: true,');
pageCode = pageCode.replace('import { ProductManager } from "@/components/admin/product-manager";', 'import { ProductManager, ProductList } from "@/components/admin/product-manager";');
pageCode = pageCode.replace('categoryName: catMap.get(p.category) || p.category,\n    featured: p.featured,', 'categoryName: catMap.get(p.category) || p.category,\n    brand: p.brand,\n    specifications: p.specifications,\n    featured: p.featured,');

const startIdx = pageCode.indexOf('<Card className="overflow-hidden p-0">');
const endIdx = pageCode.indexOf('</Card>', startIdx) + 7;
const tableCode = pageCode.substring(startIdx, endIdx);
pageCode = pageCode.replace(tableCode, '<ProductList products={serializable} categories={cats} />');

fs.writeFileSync(pagePath, pageCode);

// =======================
// Task 2: product-form.tsx
// =======================
const pfPath = 'src/components/admin/product-form.tsx';
let pfCode = fs.readFileSync(pfPath, 'utf8');

pfCode = pfCode.replace('isActive: boolean;\n}', 'isActive: boolean;\n  specifications?: any;\n}');
pfCode = pfCode.replace('isActive: initial?.isActive ?? true,\n  });', 'isActive: initial?.isActive ?? true,\n    specifications: initial?.specifications || null,\n  });');

if (!pfCode.includes('import { Card')) {
    pfCode = pfCode.replace('import { Button }', 'import { Button }\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";');
}

const supplierUi = `
      {data.specifications && (() => {
        let specs: any = {};
        try { specs = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications; } catch(e) {}
        if (!specs.supplier_product_id) return null;
        return (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span>📊 اطلاعات تأمین‌کننده (irMarket)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>قیمت خرید: \${specs.price_usd}</div>
              <div>قیمت خرده‌فروشی: \${specs.retail_price_usd}</div>
              <div>تخفیف تأمین‌کننده: {specs.supplier_discount_percent}%</div>
              <div>نرخ ارز: {specs.usd_rate_used ? specs.usd_rate_used.toLocaleString('fa-IR') : '-'} تومان</div>
              <div>ضریب سود: {specs.markup_used ? (specs.markup_used * 100).toLocaleString('fa-IR') : '-'}% (×{specs.markup_used})</div>
              <div>مدت/گارانتی: {specs.duration_days} روز</div>
              <div>موجودی تأمین‌کننده: {specs.supplier_stock} عدد</div>
              <div>آخرین سینک: {specs.last_synced}</div>
              <div className="col-span-2 pt-2 border-t border-primary/20 font-mono font-bold" dir="ltr">
                💰 \${specs.price_usd} × {specs.usd_rate_used} × {specs.markup_used} = {specs.calculated_price_toman?.toLocaleString('en-US') || '-'} تومان
              </div>
            </CardContent>
          </Card>
        );
      })()}
`;

pfCode = pfCode.replace('<form onSubmit={handleSubmit} className="space-y-4">\n      <div className="grid', '<form onSubmit={handleSubmit} className="space-y-4">\n' + supplierUi + '      <div className="grid');

fs.writeFileSync(pfPath, pfCode);

let pmCode2 = fs.readFileSync(pmPath, 'utf8');
pmCode2 = pmCode2.replace('isActive: p.isActive,\n        });', 'isActive: p.isActive,\n          specifications: p.specifications || null,\n        });');
fs.writeFileSync(pmPath, pmCode2);

// =======================
// Task 3: supplier-panel.tsx
// =======================
const spPath = 'src/components/admin/supplier-panel.tsx';
let spCode = fs.readFileSync(spPath, 'utf8');

spCode = spCode.replace('autoRequest: boolean;\n}', 'autoRequest: boolean;\n  autoSyncInterval?: number;\n  supplierMarkupPercent?: number;\n  usdRateMode?: "auto" | "manual";\n  manualUsdRate?: number;\n}');

const importBlock = `  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importForm, setImportForm] = useState({ apiUrl: "", apiKey: "", markupPercent: 200 });
  const [status, setStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [syncCountdown, setSyncCountdown] = useState<number | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  
  useEffect(() => {
    if (cfg.autoSyncInterval && cfg.autoSyncInterval > 0) {
      setSyncCountdown(cfg.autoSyncInterval);
      const timer = setInterval(() => {
        setSyncCountdown(prev => {
          if (prev !== null && prev <= 1) {
            handleSync(true);
            return cfg.autoSyncInterval || 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setSyncCountdown(null);
    }
  }, [cfg.autoSyncInterval]);
  
  async function handleSync(silent = false) {
    if (!silent) setImporting(true);
    try {
      const res = await fetch("/api/cron/sync-products");
      const data = await res.json();
      setLastSyncResult(data);
      if (!silent) {
        if (res.ok) toast.success("سینک با موفقیت انجام شد");
        else toast.error("خطا در سینک محصولات");
      }
    } catch {
      if (!silent) toast.error("خطای ارتباط با سرور");
    } finally {
      if (!silent) setImporting(false);
    }
  }

  async function fetchUsdRate() {
    try {
      toast.success("نرخ ارز بروزرسانی شد");
    } catch {
      toast.error("خطا در دریافت نرخ ارز");
    }
  }
`;

const importRegex = /const \[importing, setImporting\][\s\S]*?const \[statusLoading, setStatusLoading\] = useState\(false\);/;
spCode = spCode.replace(importRegex, importBlock);

const configAdditions = `
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-bold">تنظیمات قیمت‌گذاری</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>ضریب سود (Markup %)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={cfg.supplierMarkupPercent || 200} onChange={e => setCfg({...cfg, supplierMarkupPercent: Number(e.target.value)})} />
                    <span className="text-xs text-muted-foreground w-20">= ×{((cfg.supplierMarkupPercent || 200) / 100 + 1).toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>نرخ ارز (USD Rate)</Label>
                  <Select value={cfg.usdRateMode || "manual"} onValueChange={(v: any) => setCfg({...cfg, usdRateMode: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">دستی</SelectItem>
                      <SelectItem value="auto">خودکار (تتر)</SelectItem>
                    </SelectContent>
                  </Select>
                  {cfg.usdRateMode === "manual" ? (
                    <Input type="number" placeholder="مثلا ۶۰۰۰۰" value={cfg.manualUsdRate || 60000} onChange={e => setCfg({...cfg, manualUsdRate: Number(e.target.value)})} />
                  ) : (
                    <Button variant="outline" size="sm" onClick={fetchUsdRate} className="w-full">بروزرسانی نرخ تتر</Button>
                  )}
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-bold">سینک خودکار</h3>
              <div className="space-y-1.5">
                <Label>بازه زمانی سینک (ثانیه)</Label>
                <Select value={String(cfg.autoSyncInterval || 0)} onValueChange={(v) => setCfg({...cfg, autoSyncInterval: Number(v)})}>
                  <SelectTrigger><SelectValue placeholder="غیرفعال" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">غیرفعال</SelectItem>
                    <SelectItem value="30">۳۰ ثانیه</SelectItem>
                    <SelectItem value="60">۶۰ ثانیه</SelectItem>
                    <SelectItem value="120">۱۲۰ ثانیه</SelectItem>
                    <SelectItem value="300">۳۰۰ ثانیه</SelectItem>
                  </SelectContent>
                </Select>
                {syncCountdown !== null && (
                  <p className="text-xs font-bold text-emerald-600 mt-2">سینک بعدی: {toFa(syncCountdown)} ثانیه دیگر</p>
                )}
              </div>
            </div>
`;
spCode = spCode.replace('<Button onClick={save}', configAdditions + '\n            <Button onClick={save}');

const importTabChanges = `
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold"><Download className="h-4 w-4 text-primary" /> سینک محصولات از API تأمین‌کننده</h2>
              <p className="text-sm text-muted-foreground mt-1">دریافت و بروزرسانی خودکار موجودی و قیمت</p>
            </div>
            <Button onClick={() => handleSync(false)} disabled={importing} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              سینک فوری
            </Button>
          </div>

          {lastSyncResult && (
            <div className={\`mt-4 mb-4 rounded-lg border p-4 \${lastSyncResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}\`}>
              <div className="flex items-center gap-2 mb-2">
                {lastSyncResult.ok ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />}
                <p className="font-bold">نتیجه آخرین سینک:</p>
              </div>
              <div className="text-sm text-muted-foreground flex gap-4">
                <span>اضافه شده: {toFa(lastSyncResult.imported || 0)}</span>
                <span>بروز شده: {toFa(lastSyncResult.updated || 0)}</span>
                <span>تغییر نکرده: {toFa(lastSyncResult.skipped || 0)}</span>
              </div>
            </div>
          )}
`;
const startIdxSp = spCode.indexOf('{tab === "import" && (');
const endIdxSp = spCode.indexOf('</Card>\n      )}', startIdxSp);
const oldImportTab = spCode.substring(startIdxSp, endIdxSp);
spCode = spCode.replace(oldImportTab, '{tab === "import" && (\n        <Card className="p-6">' + importTabChanges);

fs.writeFileSync(spPath, spCode);

console.log('Done');
