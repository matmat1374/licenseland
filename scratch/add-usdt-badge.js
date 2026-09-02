const fs = require('fs');
let c = fs.readFileSync('src/components/admin/admin-shell.tsx', 'utf8');

const usdtBadgeCode = `
import { useEffect } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { toFa } from "@/lib/date";
import { Badge } from "@/components/ui/badge";

function UsdtRateHeaderBadge() {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string>("auto");

  async function loadRate() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usdt-rate");
      const data = await res.json();
      if (data.ok && data.rate) {
        setRate(data.rate);
        setMode(data.mode);
      }
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadRate();
    const interval = setInterval(loadRate, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, []);

  if (!rate) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        onClick={loadRate}
        className="cursor-pointer gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
        title={mode === "auto" ? "نرخ آنلاین صرافی‌های ارز دیجیتال (والکس / رمGroup)" : "نرخ دستی ادمین"}
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>نرخ تتر: {toFa(rate.toLocaleString("fa-IR"))} تومان</span>
        <RefreshCw className={cn("h-3 w-3 mr-0.5", loading && "animate-spin text-emerald-500")} />
      </Badge>
    </div>
  );
}
`;

c = c.replace('import { SITE } from "@/lib/constants";', 'import { SITE } from "@/lib/constants";\n' + usdtBadgeCode);

// Add to header
c = c.replace(
  '<div className="mr-auto hidden items-center gap-2 lg:flex">',
  '<div className="mr-auto hidden items-center gap-3 lg:flex">\n            <UsdtRateHeaderBadge />'
);

fs.writeFileSync('src/components/admin/admin-shell.tsx', c);
console.log('Successfully added UsdtRateHeaderBadge to AdminShell');
