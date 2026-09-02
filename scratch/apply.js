const fs = require('fs');

let p_page = "src/app/admin/products/page.tsx";
let code = fs.readFileSync(p_page, "utf-8");

code = code.replace(
    'import { ProductManager, ProductList } from "@/components/admin/product-manager";',
    'import { ProductManager, ProductList } from "@/components/admin/product-manager";\nimport { getUsdToTomanRate } from "@/lib/supplier";'
);
code = code.replace(
    'export default async function AdminProductsPage() {',
    'export default async function AdminProductsPage() {\n  const liveUsdRate = await getUsdToTomanRate();'
);
code = code.replace(
    '<ProductManager mode="create" categories={cats}>',
    '<ProductManager mode="create" categories={cats} liveUsdRate={liveUsdRate}>'
);
code = code.replace(
    '<ProductList products={serializable} categories={cats} />',
    '<ProductList products={serializable} categories={cats} liveUsdRate={liveUsdRate} />'
);
fs.writeFileSync(p_page, code, "utf-8");

let p_mgr = "src/components/admin/product-manager.tsx";
let mgr_code = fs.readFileSync(p_mgr, "utf-8");

mgr_code = mgr_code.replace(
    'export function ProductManager({ mode, product, categories, children }: ProductManagerProps) {',
    'export function ProductManager({ mode, product, categories, children, liveUsdRate }: ProductManagerProps & { liveUsdRate?: number }) {'
);
mgr_code = mgr_code.replace(
    'export function ProductList({ products, categories }: { products: any[], categories: any[] }) {',
    'export function ProductList({ products, categories, liveUsdRate }: { products: any[], categories: any[], liveUsdRate?: number }) {'
);
mgr_code = mgr_code.replace(
    'const usdRate = specs.usd_rate_used || 60000;',
    'const usdRate = specs.usd_rate_used || liveUsdRate || 60000;'
);
mgr_code = mgr_code.replace(
    'import { Pencil, Trash2, Loader2 } from "lucide-react";',
    'import { Pencil, Trash2, Loader2 } from "lucide-react";\nimport { Switch } from "@/components/ui/switch";'
);
mgr_code = mgr_code.replace(
    '<Badge variant={p.isActive ? "default" : "secondary"}>\n                        {p.isActive ? "فعال" : "غیرفعال"}\n                      </Badge>',
    '<Switch checked={p.isActive} onCheckedChange={async (v) => { try { await fetch("/api/admin/products", { method: "PUT", body: JSON.stringify({ id: p.id, isActive: v }) }); window.location.reload(); } catch(e){} }} />'
);

const bulk_btn = `
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
`;
mgr_code = mgr_code.replace(
    '<div className="space-y-4">',
    '<div className="space-y-4">\n' + bulk_btn
);

fs.writeFileSync(p_mgr, mgr_code, "utf-8");

let p_frm = "src/components/admin/product-form.tsx";
let frm_code = fs.readFileSync(p_frm, "utf-8");

frm_code = frm_code.replace(
    'export function ProductForm({ initial, categories, onSaved, onCancel }: ProductFormProps) {',
    'export function ProductForm({ initial, categories, onSaved, onCancel, liveUsdRate }: ProductFormProps & { liveUsdRate?: number }) {'
);
frm_code = frm_code.replace(
    '{toFa(parsedSpecs.usd_rate_used || 200000)} تومان',
    '{toFa(parsedSpecs.usd_rate_used || liveUsdRate || 200000)} تومان'
);
fs.writeFileSync(p_frm, frm_code, "utf-8");

console.log("DONE");
