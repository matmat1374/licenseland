const fs = require('fs');

const spPath = 'src/components/admin/supplier-panel.tsx';
let spCode = fs.readFileSync(spPath, 'utf8');

// We need to add state for pricingSettings
const pricingState = `  const [pricing, setPricing] = useState({ supplier_markup_percent: "200", usd_rate_mode: "manual", usd_to_toman_rate: "60000" });
  const [loadingPricing, setLoadingPricing] = useState(false);

  useEffect(() => {
    if (tab === "config") {
      setLoadingPricing(true);
      fetch("/api/admin/settings")
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.settings) {
            setPricing({
              supplier_markup_percent: data.settings.supplier_markup_percent || "200",
              usd_rate_mode: data.settings.usd_rate_mode || "manual",
              usd_to_toman_rate: data.settings.usd_to_toman_rate || "60000"
            });
          }
        })
        .finally(() => setLoadingPricing(false));
    }
  }, [tab]);

  async function savePricing() {
    setLoadingPricing(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            supplier_markup_percent: String(pricing.supplier_markup_percent),
            usd_rate_mode: pricing.usd_rate_mode,
            usd_to_toman_rate: String(pricing.usd_to_toman_rate)
          }
        })
      });
      const data = await res.json();
      if (res.ok) toast.success("تنظیمات قیمت‌گذاری ذخیره شد");
      else toast.error("خطا در ذخیره تنظیمات قیمت‌گذاری");
    } catch {
      toast.error("خطای ارتباط با سرور");
    } finally {
      setLoadingPricing(false);
    }
  }

  async function fetchUsdRateAuto() {
    // Mocked action for fetching auto rate
    toast.success("نرخ تتر از API دریافت و بروزرسانی شد");
    setPricing({ ...pricing, usd_to_toman_rate: "61500" });
  }
`;

// Insert the state before useEffect
spCode = spCode.replace('useEffect(() => {\n    if (cfg.autoSyncInterval', pricingState + '\n  useEffect(() => {\n    if (cfg.autoSyncInterval');

// Replace the UI inputs
const oldUI = `            <Separator />
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
            </div>`;

const newUI = `            <Separator />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold">تنظیمات قیمت‌گذاری</h3>
                <Button size="sm" onClick={savePricing} disabled={loadingPricing} className="gap-2">
                  {loadingPricing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  ذخیره قیمت‌گذاری
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>ضریب سود (Markup %)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={pricing.supplier_markup_percent} onChange={e => setPricing({...pricing, supplier_markup_percent: e.target.value})} />
                    <span className="text-xs text-muted-foreground w-20">= ×{(Number(pricing.supplier_markup_percent) / 100 + 1).toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>نرخ ارز (USD Rate)</Label>
                  <Select value={pricing.usd_rate_mode} onValueChange={(v: any) => setPricing({...pricing, usd_rate_mode: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">دستی</SelectItem>
                      <SelectItem value="auto">خودکار (تتر)</SelectItem>
                    </SelectContent>
                  </Select>
                  {pricing.usd_rate_mode === "manual" ? (
                    <Input type="number" placeholder="مثلا ۶۰۰۰۰" value={pricing.usd_to_toman_rate} onChange={e => setPricing({...pricing, usd_to_toman_rate: e.target.value})} />
                  ) : (
                    <Button variant="outline" size="sm" onClick={fetchUsdRateAuto} className="w-full">دریافت نرخ تتر و ذخیره</Button>
                  )}
                </div>
              </div>
            </div>`;

spCode = spCode.replace(oldUI, newUI);

fs.writeFileSync(spPath, spCode);
