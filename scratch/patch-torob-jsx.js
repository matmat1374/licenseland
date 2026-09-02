const fs = require('fs');
let c = fs.readFileSync('src/components/admin/product-form.tsx', 'utf8');

const targetJSX = `            <div className="space-y-2">
              <Label>ضریب سود اختصاصی (درصد)</Label>
              <Input
                type="number"
                value={formData.customMarkup}
                onChange={(e) => setFormData({ ...formData, customMarkup: e.target.value })}
                placeholder="مثلاً 100"
              />
              <p className="text-xs text-muted-foreground">خالی بگذارید تا از سود پله‌ای پیش‌فرض استفاده شود.</p>
            </div>
          </div>
        </div>`;

const newJSX = `            <div className="space-y-2">
              <Label>ضریب سود اختصاصی (درصد)</Label>
              <Input
                type="number"
                value={formData.customMarkup}
                onChange={(e) => setFormData({ ...formData, customMarkup: e.target.value })}
                placeholder="مثلاً 100"
              />
              <p className="text-xs text-muted-foreground">خالی بگذارید تا از سود پله‌ای پیش‌فرض استفاده شود.</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <span className="text-red-500 font-bold">ترب</span> ربات قیمت‌شکن
            </h3>
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <Label>لینک محصول در سایت ترب (اختیاری)</Label>
                <Input
                  type="url"
                  value={formData.torobUrl}
                  onChange={(e) => setFormData({ ...formData, torobUrl: e.target.value })}
                  placeholder="https://torob.com/p/..."
                />
                <p className="text-xs text-muted-foreground">با قرار دادن لینک ترب، قیمت این محصول به صورت اتوماتیک کمتر از ارزان‌ترین فروشنده تنظیم می‌شود.</p>
              </div>
              <div className="space-y-2">
                <Label>چقدر ارزان‌تر؟ (درصد)</Label>
                <Input
                  type="number"
                  value={formData.torobUndercut}
                  onChange={(e) => setFormData({ ...formData, torobUndercut: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>کف سود مجاز (درصد)</Label>
                <Input
                  type="number"
                  value={formData.torobFloor}
                  onChange={(e) => setFormData({ ...formData, torobFloor: e.target.value })}
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground">محافظت از ضرر: قیمت هرگز از (قیمت خرید + این درصد سود) پایین‌تر نخواهد رفت.</p>
              </div>
            </div>
          </div>
        </div>`;

c = c.replace(targetJSX, newJSX);

fs.writeFileSync('src/components/admin/product-form.tsx', c);
console.log('Patched JSX');
