const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

const replacement = `        </div>
        
        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4 mt-2 sm:col-span-3">
          <Label htmlFor="customMarkup" className="font-bold text-emerald-400">ضریب سود اختصاصی (درصد)</Label>
          <Input
            id="customMarkup"
            type="number"
            className="w-32 text-center bg-background"
            value={data.customMarkup || ""}
            onChange={(e) => set("customMarkup", e.target.value)}
            dir="ltr"
            placeholder="مثلا 150"
          />
        </div>
        <div className="flex items-center justify-between gap-4 sm:col-span-3 pb-2">
          <Label htmlFor="isPriceLocked" className="cursor-pointer font-bold leading-relaxed text-destructive">قفل قیمت (عدم آپدیت خودکار مبلغ)</Label>
          <Switch
            id="isPriceLocked"
            checked={data.isPriceLocked}
            onCheckedChange={(v) => set("isPriceLocked", v)}
          />
        </div>
      </div>`;

c = c.replace(/<Switch\s+id="isActive"[\s\S]*?<\/div>\s*<\/div>/, (match) => {
    return match.replace(/<\/div>\s*<\/div>$/, replacement);
});

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log("Patched correctly with regex!");
