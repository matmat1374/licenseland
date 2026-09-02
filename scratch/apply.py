import os

p_page = "src/app/admin/products/page.tsx"
with open(p_page, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    'import { ProductManager, ProductList } from "@/components/admin/product-manager";',
    'import { ProductManager, ProductList } from "@/components/admin/product-manager";\nimport { getUsdToTomanRate } from "@/lib/supplier";'
)
code = code.replace(
    'export default async function AdminProductsPage() {',
    'export default async function AdminProductsPage() {\n  const liveUsdRate = await getUsdToTomanRate();'
)
code = code.replace(
    '<ProductManager mode="create" categories={cats}>',
    '<ProductManager mode="create" categories={cats} liveUsdRate={liveUsdRate}>'
)
code = code.replace(
    '<ProductList products={serializable} categories={cats} />',
    '<ProductList products={serializable} categories={cats} liveUsdRate={liveUsdRate} />'
)
with open(p_page, "w", encoding="utf-8") as f:
    f.write(code)

p_mgr = "src/components/admin/product-manager.tsx"
with open(p_mgr, "r", encoding="utf-8") as f:
    mgr_code = f.read()

mgr_code = mgr_code.replace(
    'export function ProductManager({ mode, product, categories, children }: ProductManagerProps) {',
    'export function ProductManager({ mode, product, categories, children, liveUsdRate }: ProductManagerProps & { liveUsdRate?: number }) {'
)
mgr_code = mgr_code.replace(
    'export function ProductList({ products, categories }: { products: any[], categories: any[] }) {',
    'export function ProductList({ products, categories, liveUsdRate }: { products: any[], categories: any[], liveUsdRate?: number }) {'
)
mgr_code = mgr_code.replace(
    'const usdRate = specs.usd_rate_used || 60000;',
    'const usdRate = specs.usd_rate_used || liveUsdRate || 60000;'
)
mgr_code = mgr_code.replace(
    'import { Pencil, Trash2, Loader2 } from "lucide-react";',
    'import { Pencil, Trash2, Loader2 } from "lucide-react";\nimport { Switch } from "@/components/ui/switch";'
)
mgr_code = mgr_code.replace(
    '<Badge variant={p.isActive ? "default" : "secondary"}>\n                        {p.isActive ? "فعال" : "غیرفعال"}\n                      </Badge>',
    '<Switch checked={p.isActive} onCheckedChange={async (v) => { try { await fetch("/api/admin/products", { method: "PUT", body: JSON.stringify({ id: p.id, isActive: v }) }); window.location.reload(); } catch(e){} }} />'
)

bulk_btn = """
      <div className="flex items-center gap-2">
        <select id="bulkCat" className="border rounded p-1 text-sm bg-background">
          <option value="">انتخاب دستهبندی...</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={async () => {
          const cat = (document.getElementById('bulkCat') as HTMLSelectElement).value;
          if(!cat) return;
          const toUpdate = products.filter(p => p.category === cat);
          for(const p of toUpdate) {
            await fetch("/api/admin/products", { method: "PUT", body: JSON.stringify({ id: p.id, isActive: !p.isActive }) });
          }
          window.location.reload();
        }}>تغییر وضعیت گروهی</Button>
      </div>
"""
mgr_code = mgr_code.replace(
    '<div className="space-y-4">',
    '<div className="space-y-4">\n' + bulk_btn
)

with open(p_mgr, "w", encoding="utf-8") as f:
    f.write(mgr_code)

p_frm = "src/components/admin/product-form.tsx"
with open(p_frm, "r", encoding="utf-8") as f:
    frm_code = f.read()

frm_code = frm_code.replace(
    'export function ProductForm({ initial, categories, onSaved, onCancel }: ProductFormProps) {',
    'export function ProductForm({ initial, categories, onSaved, onCancel, liveUsdRate }: ProductFormProps & { liveUsdRate?: number }) {'
)
frm_code = frm_code.replace(
    '{toFa(parsedSpecs.usd_rate_used || 200000)} تومان',
    '{toFa(parsedSpecs.usd_rate_used || liveUsdRate || 200000)} تومان'
)
with open(p_frm, "w", encoding="utf-8") as f:
    f.write(frm_code)

print("DONE")
