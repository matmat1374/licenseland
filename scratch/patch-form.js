const fs = require('fs');

let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

// 1. Add customMarkup to Interface
if (!c.includes('customMarkup?: string;')) {
    c = c.replace('isPriceLocked: boolean;', 'isPriceLocked: boolean;\n  customMarkup?: string;');
}

// 2. Add customMarkup to state initialization
if (!c.includes('customMarkup: (() => {')) {
    c = c.replace('isPriceLocked: (() => {', `customMarkup: (() => {
        try { return JSON.parse(initial?.specifications || "{}").custom_markup?.toString() || ""; } catch { return ""; }
      })(),
      isPriceLocked: (() => {`);
}

// 3. Add custom_markup to specs before sending
if (!c.includes('sp.custom_markup =')) {
    c = c.replace('sp.is_price_locked = data.isPriceLocked;', `sp.is_price_locked = data.isPriceLocked;
          if (data.customMarkup) sp.custom_markup = Number(data.customMarkup);
          else delete sp.custom_markup;`);
}

// 4. Add JSX for Custom Markup and Price Lock
const priceLockJSX = `
        <div className="space-y-1.5">
          <Label htmlFor="customMarkup">ضریب اختصاصی (درصد سود)</Label>
          <Input
            id="customMarkup"
            type="number"
            value={data.customMarkup || ""}
            onChange={(e) => set("customMarkup", e.target.value)}
            dir="ltr"
            placeholder="مثلا: 150 (درصد)"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="isPriceLocked" className="cursor-pointer font-bold leading-relaxed text-destructive">قفل قیمت (عدم آپدیت خودکار)</Label>
          <Switch
            id="isPriceLocked"
            checked={data.isPriceLocked}
            onCheckedChange={(v) => set("isPriceLocked", v)}
          />
        </div>
`;

if (!c.includes('isPriceLocked"')) {
    c = c.replace('</form>', `</form>`); // dummy
    // Insert after "isActive" switch
    c = c.replace(/(<Switch\s+id="isActive"[^>]+>\s*<\/div>)/, `$1\n${priceLockJSX}`);
}

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('product-form.tsx patched!');
