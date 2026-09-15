import {
  BadgePercent,
  Code,
  Code2,
  Folder,
  Gamepad2,
  Gift,
  Headphones,
  LayoutGrid,
  Package,
  PenTool,
  Play,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

/**
 * رجیستری ثابت آیکون دسته‌بندی‌ها.
 *
 * چرا ثابت و نه `import * as Icons from "lucide-react"`؟
 * آن الگو کل بشکهٔ lucide (~۱۵۰۰ آیکون) را در باندل می‌ریخت:
 * دو چانک ۵۷۹٬۰۴۵ + ۱۴۷٬۵۵۷ بایت خام (۱۸۴٬۷۵۱ gz در level 9) روی **هر** مسیر
 * ⇒ اندازه‌گیری‌شده: −۶۹۸٬۷۵۵ خام / −۱۷۵٬۸۷۳ gz به‌ازای هر مسیر.
 * رجیستری ثابت با import نام‌دار فقط همان آیکون‌های استفاده‌شده را می‌آورد.
 *
 * مجموعهٔ پوشش‌داده‌شده = اجتماع مقادیر واقعی `Category.icon` در DB (۱۱ مقدار)
 * و `CATEGORIES` در src/lib/constants.ts (۱۲ مقدار) = ۱۵ نام.
 *
 * ⚠️ اگر دستهٔ جدیدی با نام آیکون **تازهٔ** lucide ساخته شود، تا افزودنش به همین
 * فایل با `Folder` نمایش داده می‌شود (قبلاً آیکون درست نشان داده می‌شد). افزودن یک
 * نام تازه به شکل زیر کافی است: import نام‌دار + یک سطر در CATEGORY_ICONS.
 */
export const CATEGORY_ICONS = {
  BadgePercent,
  Code,
  Code2,
  Gamepad2,
  Gift,
  Headphones,
  LayoutGrid,
  Package,
  PenTool,
  Play,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} as const;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

const ICON_MAP: Record<string, typeof Folder> = CATEGORY_ICONS;

/** آیکون دسته را برمی‌گرداند؛ نام ناشناس/خالی ⇒ Folder (همان fallback قبلی). */
export function categoryIcon(name?: string | null) {
  return (name && ICON_MAP[name]) || Folder;
}
