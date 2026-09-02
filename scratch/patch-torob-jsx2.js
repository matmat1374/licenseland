const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

const targetJSX = `<div className="flex items-center justify-between gap-4 sm:col-span-3 pb-2">
          <Label htmlFor="isPriceLocked" className="cursor-pointer font-bold leading-relaxed text-destructive">قفل قیمت (عدم آپدیت خودکار مبلغ)</Label>
          <Switch
            id="isPriceLocked"
            checked={data.isPriceLocked}
            onCheckedChange={(v) => set("isPriceLocked", v)}
          />
        </div>
      </div>`;

const newJSX = `<div className="flex items-center justify-between gap-4 sm:col-span-3 pb-2">
          <Label htmlFor="isPriceLocked" className="cursor-pointer font-bold leading-relaxed text-destructive">قفل قیمت (عدم آپدیت خودکار مبلغ)</Label>
          <Switch
            id="isPriceLocked"
            checked={data.isPriceLocked}
            onCheckedChange={(v) => set("isPriceLocked", v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 sm:grid-cols-2 mt-4">
        <h3 className="text-lg font-bold text-red-500 sm:col-span-2 mb-2 flex items-center gap-2">ربات قیمت‌شکن ترب</h3>
        
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="torobUrl">لینک محصول در سایت ترب (اختیاری)</Label>
          <Input
            id="torobUrl"
            value={data.torobUrl || ""}
            onChange={(e) => set("torobUrl", e.target.value)}
            placeholder="https://torob.com/p/..."
            dir="ltr"
          />
          <p className="text-[11px] text-muted-foreground mt-1">با قرار دادن این لینک، قیمت این محصول اتوماتیک آپدیت می‌شود.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="torobUndercut">چقدر ارزان‌تر؟ (درصد)</Label>
          <Input
            id="torobUndercut"
            type="number"
            value={data.torobUndercut || ""}
            onChange={(e) => set("torobUndercut", e.target.value)}
            placeholder="5"
            dir="ltr"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="torobFloor">کف سود مجاز (حفاظت از ضرر - درصد)</Label>
          <Input
            id="torobFloor"
            type="number"
            value={data.torobFloor || ""}
            onChange={(e) => set("torobFloor", e.target.value)}
            placeholder="15"
            dir="ltr"
          />
        </div>
      </div>`;

c = c.replace(targetJSX, newJSX);

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Patched JSX properly');
