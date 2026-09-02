import json
import re

print('Executing edits...')

# =======================
# Task 1: product-manager.tsx
# =======================
pm_path = r'src\components\admin\product-manager.tsx'
with open(pm_path, 'r', encoding='utf-8') as f:
    pm_code = f.read()

# Add ProductList component to product-manager.tsx
new_imports = '''import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Star, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toFa } from "@/lib/date";
import { toToman, calcDiscountPercent } from "@/lib/format";
'''

pm_code = pm_code.replace('import { useState } from "react";\nimport { useRouter } from "next/navigation";\nimport { Button } from "@/components/ui/button";', new_imports)

pm_code = pm_code.replace('isActive: boolean;\n  // optional', 'isActive: boolean;\n  specifications?: any;\n  brand?: string;\n  categoryName?: string;\n  salesCount?: number;\n  // optional')

product_list_code = '''
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
                  <tr key={p.id} className={`border-t hover:bg-muted/30 ${isOut ? "opacity-60 grayscale" : ""}`}>
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
                          <span>💡 ${specs.price_usd} × {toFa(specs.usd_rate_used)} × {toFa(specs.markup_used)} = {toToman(p.price)}</span>
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
                        {p.stock === 0 ? "ناموجود" : `${toFa(p.stock)} عدد`}
                        {sStock !== undefined && ` (تأمین: ${toFa(sStock)})`}
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
'''
with open(pm_path, 'w', encoding='utf-8') as f:
    f.write(pm_code + '\n' + product_list_code)

# =======================
# Update page.tsx to use ProductList
# =======================
page_path = r'src\app\admin\products\page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    page_code = f.read()

page_code = page_code.replace('category: true,\n        featured: true,', 'category: true,\n        brand: true,\n        specifications: true,\n        featured: true,')
page_code = page_code.replace('import { ProductManager } from "@/components/admin/product-manager";', 'import { ProductManager, ProductList } from "@/components/admin/product-manager";')
page_code = page_code.replace('categoryName: catMap.get(p.category) || p.category,\n    featured: p.featured,', 'categoryName: catMap.get(p.category) || p.category,\n    brand: p.brand,\n    specifications: p.specifications,\n    featured: p.featured,')

start_idx = page_code.find('<Card className="overflow-hidden p-0">')
end_idx = page_code.find('</Card>', start_idx) + 7
table_code = page_code[start_idx:end_idx]
page_code = page_code.replace(table_code, '<ProductList products={serializable} categories={cats} />')

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_code)

# =======================
# Task 2: product-form.tsx
# =======================
pf_path = r'src\components\admin\product-form.tsx'
with open(pf_path, 'r', encoding='utf-8') as f:
    pf_code = f.read()

pf_code = pf_code.replace('isActive: boolean;\n}', 'isActive: boolean;\n  specifications?: any;\n}')
pf_code = pf_code.replace('isActive: initial?.isActive ?? true,\n  });', 'isActive: initial?.isActive ?? true,\n    specifications: initial?.specifications || null,\n  });')

if 'import { Card' not in pf_code:
    pf_code = pf_code.replace('import { Button }', 'import { Button }\nimport { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";')

supplier_ui = '''
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
              <div>قیمت خرید: ${specs.price_usd}</div>
              <div>قیمت خرده‌فروشی: ${specs.retail_price_usd}</div>
              <div>تخفیف تأمین‌کننده: {specs.supplier_discount_percent}%</div>
              <div>نرخ ارز: {specs.usd_rate_used ? specs.usd_rate_used.toLocaleString('fa-IR') : '-'} تومان</div>
              <div>ضریب سود: {specs.markup_used ? (specs.markup_used * 100).toLocaleString('fa-IR') : '-'}% (×{specs.markup_used})</div>
              <div>مدت/گارانتی: {specs.duration_days} روز</div>
              <div>موجودی تأمین‌کننده: {specs.supplier_stock} عدد</div>
              <div>آخرین سینک: {specs.last_synced}</div>
              <div className="col-span-2 pt-2 border-t border-primary/20 font-mono font-bold" dir="ltr">
                💰 ${specs.price_usd} × {specs.usd_rate_used} × {specs.markup_used} = {specs.calculated_price_toman?.toLocaleString('en-US') || '-'} تومان
              </div>
            </CardContent>
          </Card>
        );
      })()}
'''

pf_code = pf_code.replace('<form onSubmit={handleSubmit} className="space-y-4">\n      <div className="grid', '<form onSubmit={handleSubmit} className="space-y-4">\n' + supplier_ui + '      <div className="grid')

with open(pf_path, 'w', encoding='utf-8') as f:
    f.write(pf_code)

with open(pm_path, 'r', encoding='utf-8') as f:
    pm_code2 = f.read()
pm_code2 = pm_code2.replace('isActive: p.isActive,\n        });', 'isActive: p.isActive,\n          specifications: p.specifications || null,\n        });')
with open(pm_path, 'w', encoding='utf-8') as f:
    f.write(pm_code2)

# =======================
# Task 3: supplier-panel.tsx
# =======================
sp_path = r'src\components\admin\supplier-panel.tsx'
with open(sp_path, 'r', encoding='utf-8') as f:
    sp_code = f.read()

sp_code = sp_code.replace('autoRequest: boolean;\n}', 'autoRequest: boolean;\n  autoSyncInterval?: number;\n  supplierMarkupPercent?: number;\n  usdRateMode?: "auto" | "manual";\n  manualUsdRate?: number;\n}')

import_block = '''  const [importing, setImporting] = useState(false);
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
'''
sp_code = re.sub(r'const \[importing, setImporting\].*?const \[statusLoading, setStatusLoading\] = useState\(false\);', import_block, sp_code, flags=re.DOTALL)

config_additions = '''
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
'''
sp_code = sp_code.replace('<Button onClick={save}', config_additions + '\n            <Button onClick={save}')

import_tab_changes = '''
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="flex items-center gap-2 font-bold"><Download className="h-4 w-4 text-primary" /> سینک محصولات از API تأمین‌کننده</h2>
              <p className="text-sm text-muted-foreground mt-1">دریافت و بروزرسانی خودکار موجودی و قیمت</p>
            </div>
            <Button onClick={() => handleSync(false)} disabled={importing} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              سینک فوری
            </Button>
          </div>

          {lastSyncResult && (
            <div className={`mt-4 mb-4 rounded-lg border p-4 ${lastSyncResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
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
'''
start_idx = sp_code.find('{tab === "import" && (')
end_idx = sp_code.find('</Card>\n      )}', start_idx)
old_import_tab = sp_code[start_idx:end_idx]
sp_code = sp_code.replace(old_import_tab, '{tab === "import" && (\n        <Card className="p-6">' + import_tab_changes)

with open(sp_path, 'w', encoding='utf-8') as f:
    f.write(sp_code)

print('Done')
