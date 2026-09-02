const fs = require('fs');

let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

// Add field to state
c = c.replace('isActive: boolean;', 'isActive: boolean;\n  isPriceLocked: boolean;');
c = c.replace('isActive: initial?.isActive ?? true,', 'isActive: initial?.isActive ?? true,\n      isPriceLocked: (() => {\n        try { return JSON.parse(initial?.specifications || "{}").is_price_locked || false; } catch { return false; }\n      })(),');

// Add field to payload
c = c.replace('isActive: data.isActive,', 'isActive: data.isActive,\n      specifications: (() => {\n        try { \n          const sp = JSON.parse(initial?.specifications || "{}");\n          sp.is_price_locked = data.isPriceLocked;\n          return sp;\n        } catch { return { is_price_locked: data.isPriceLocked }; }\n      })(),');

// Add UI switch
const toggleUi = `
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="isPriceLocked" className="cursor-pointer font-bold leading-relaxed text-amber-500">قفل قیمت (عدم آپدیت خودکار)</Label>
          <Switch
            id="isPriceLocked"
            checked={data.isPriceLocked}
            onCheckedChange={(v) => set("isPriceLocked", v)}
          />
        </div>
`;
c = c.replace('<div className="flex items-center justify-between gap-4">\n          <Label htmlFor="isActive" className="cursor-pointer font-bold leading-relaxed text-primary">', toggleUi + '\n        <div className="flex items-center justify-between gap-4">\n          <Label htmlFor="isActive" className="cursor-pointer font-bold leading-relaxed text-primary">');

fs.writeFileSync('src/components/admin/product-form.tsx', c, 'utf8');
console.log('patched product form for price lock');
