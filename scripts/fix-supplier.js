const fs = require('fs');
let supplierContent = fs.readFileSync('src/lib/supplier.ts', 'utf8');
supplierContent = supplierContent.replace(/function categorizeProduct\(p: SupplierProduct\): \{ slug: string; name: string \} \{.*?return \{ slug, name: CATEGORIES_META\[slug\] \};\s*\}/s, `function categorizeProduct(p: SupplierProduct): { slug: string; name: string } {
  const name = pickTitle(p);
  const n = (name || "").toLowerCase();

  let slug = "software";
  if (/xbox|ایکس باکس|playstation|پلی استیشن|ps4|ps5|nintendo|نینتندو|steam|استیم|epic games|اپیک گیمز|origin|uplay|ea play|game pass|گیم پس|gta|minecraft|ماینکرافت|fortnite|فورتنایت|pubg|پابجی|valorant|ولورانت|battlenet|blizzard|بلیزارد|گیم|بازی/.test(n)) slug = "gaming";
  else if (/netflix|نتفلیکس|spotify|اسپاتیفای|youtube|یوتیوب|apple tv|اپل تی وی|disney|دیزنی|hbo|paramount|پارامونت|deezer|دیزر|tidal|تایدال|crunchyroll|کرانچی رول|prime video|پرایم ویدیو|twitch|توییچ|فیلم|سینما|موسیقی|sound cloud|ساندکلاد/.test(n)) slug = "streaming";
  else if (/chatgpt|چت جی پی تی|چتجیپیتی|claude|کلاود|کلود|gemini|جمینی|midjourney|میدجرنی|openai|اوپن ای آی|anthropic|آنتروپیک|copilot|کوپایلوت|grok|گروک|perplexity|پرپلکسیتی|cursor|کورسور|windsurf|ویندسرف|runway|رانوی|suno|سونو|udio|یودیو|elevenlabs|الون لبز|pika|پیکا|dall|دال ای|kling|کلینگ|leonardo|لئوناردو|heygen|هی جن|هیجن|higgsfield|هیگزفیلد|veo|ویو|گوگل ویو|genspark|جن اسپارک|lovable|لاویبل|openart|اوپن آرت|pixverse|پیکس ورس|seedance|سیدنس|akool|آکول|beeble|بیبل|sora|سورا|هوش مصنوعی/.test(n)) slug = "ai";
  else if (/telegram|تلگرام|discord|دیسکورد|twitter|توییتر|x premium|linkedin|لینکدین|instagram|اینستاگرام|facebook|فیسبوک|tiktok|تیک تاک|تیک آبی/.test(n)) slug = "social";
  else if (/canva|کنوا|کانوا|adobe|ادوبی|figma|فیگما|sketch|اسکچ|invision|notion|نوشن|framer|فریمر|miro|میرو|creativecloud|lightroom|لایت روم|photoshop|فتوشاپ|illustrator|ایلوستریتور|premiere|پریمیر|after effects|افتر افکت|envato|انواتو|freepik|فری پیک/.test(n)) slug = "design";
  else if (/vpn|وی پی ان|فیلترشکن|nordvpn|نورد|expressvpn|اکسپرس|surfshark|سرف شارک|cyberghost|proton|پروتون|malwarebytes|bitdefender|بیت دیفندر|kaspersky|کسپراسکای|کسپرسکی|norton|نورتون|antivirus|آنتی ویروس|1password|وان پسورد|lastpass|bitwarden|بیت واردن/.test(n)) slug = "security";
  else if (/coursera|کورسرا|udemy|یودمی|linkedin learning|masterclass|مسترکلاس|skillshare|اسکیل شیر|duolingo|دولینگو|memrise|ممرایز|babbel|بابل|rosetta|رزتا/.test(n)) slug = "education";
  else if (/windows|ویندوز|office|آفیس|microsoft|مایکروسافت|visual studio|ویژوال استودیو|jetbrains|جت برینز|autocad|اتوکد|vmware|parallels|zoom|زوم|slack|اسلک|dropbox|دراپ باکس|grammarly|گرامرلی/.test(n)) slug = "software";

  return { slug, name: CATEGORIES_META[slug] };
}`);
fs.writeFileSync('src/lib/supplier.ts', supplierContent, 'utf8');
