export const BRAND_ICON_MAP: Record<string, string> = {
  // AI & Dev Tools
  'claude': 'https://cdn.simpleicons.org/anthropic/D97706',
  'anthropic': 'https://cdn.simpleicons.org/anthropic/D97706',
  'openai': 'https://cdn.simpleicons.org/openai/412991',
  'chatgpt': 'https://cdn.simpleicons.org/openai/412991',
  'gemini': 'https://cdn.simpleicons.org/google/4285F4',
  'google': 'https://cdn.simpleicons.org/google/4285F4',
  'midjourney': 'https://cdn.simpleicons.org/midjourney/000000',
  'cursor': 'https://cdn.simpleicons.org/cursor/000000',
  'github': 'https://cdn.simpleicons.org/github/181717',
  'copilot': 'https://cdn.simpleicons.org/github/181717',
  'grok': 'https://cdn.simpleicons.org/x/000000',
  'veo': 'https://cdn.simpleicons.org/google/4285F4',
  'heygen': 'https://cdn.simpleicons.org/ai/000000',
  'higgsfield': 'https://cdn.simpleicons.org/ai/000000',
  'lovable': 'https://cdn.simpleicons.org/lovable/FF6B6B',
  
  // Streaming & Media
  'netflix': 'https://cdn.simpleicons.org/netflix/E50914',
  'spotify': 'https://cdn.simpleicons.org/spotify/1DB954',
  'youtube': 'https://cdn.simpleicons.org/youtube/FF0000',
  'disneyplus': 'https://cdn.simpleicons.org/disney/006E99',
  'apple': 'https://cdn.simpleicons.org/apple/000000',
  'capcut': 'https://cdn.simpleicons.org/capcut/000000',
  
  // Microsoft & OS
  'microsoft': 'https://cdn.simpleicons.org/microsoft/5E5E5E',
  'office': 'https://cdn.simpleicons.org/microsoftoffice/D83B01',
  'windows': 'https://cdn.simpleicons.org/windows/0078D4',
  
  // Games
  'xbox': 'https://cdn.simpleicons.org/xbox/107C10',
  'gamepass': 'https://cdn.simpleicons.org/xbox/107C10',
  'steam': 'https://cdn.simpleicons.org/steam/000000',
  'pubg': 'https://cdn.simpleicons.org/pubg/F7A325',
  'fortnite': 'https://cdn.simpleicons.org/epicgames/313131',
  'playstation': 'https://cdn.simpleicons.org/playstation/003087',
  
  // Adobe & Design
  'adobe': 'https://cdn.simpleicons.org/adobe/FF0000',
  'photoshop': 'https://cdn.simpleicons.org/adobephotoshop/31A8FF',
  'premiere': 'https://cdn.simpleicons.org/adobepremierepro/9999FF',
  'canva': 'https://cdn.simpleicons.org/canva/00C4CC',
  'figma': 'https://cdn.simpleicons.org/figma/F24E1E',
  
  // Social
  'instagram': 'https://cdn.simpleicons.org/instagram/E4405F',
  'telegram': 'https://cdn.simpleicons.org/telegram/26A5E4',
  'linkedin': 'https://cdn.simpleicons.org/linkedin/0A66C2',
  'facebook': 'https://cdn.simpleicons.org/facebook/1877F2',
  'gmail': 'https://cdn.simpleicons.org/gmail/EA4335',
  
  // Education & Other
  'grammarly': 'https://cdn.simpleicons.org/grammarly/15C39A',
  'vpn': 'https://cdn.simpleicons.org/nordvpn/4687FF',
  'nordvpn': 'https://cdn.simpleicons.org/nordvpn/4687FF',
  'expressvpn': 'https://cdn.simpleicons.org/expressvpn/DA3940',
  'duolingo': 'https://cdn.simpleicons.org/duolingo/58CC02',
  'coursera': 'https://cdn.simpleicons.org/coursera/0056D2',
  'tradingview': 'https://cdn.simpleicons.org/tradingview/131722',
  'memrise': 'https://cdn.simpleicons.org/memrise/FF4B00',
};

export const DOMAIN_MAP: Record<string, string> = {
  chatgpt: "openai.com",
  gpt: "openai.com",
  spotify: "spotify.com",
  netflix: "netflix.com",
  telegram: "telegram.org",
  pubg: "pubg.com",
  "call of duty": "callofduty.com",
  coursera: "coursera.org",
  hotmail: "outlook.live.com",
  outlook: "outlook.live.com",
  instagram: "instagram.com",
  apple: "apple.com",
  playstation: "playstation.com",
  psn: "playstation.com",
  xbox: "xbox.com",
  steam: "steampowered.com",
  canva: "canva.com",
  adobe: "adobe.com",
  figma: "figma.com",
  discord: "discord.com",
  duolingo: "duolingo.com",
  claude: "anthropic.com",
  notion: "notion.so",
  zoom: "zoom.us",
  replit: "replit.com",
  amazon: "amazon.com",
  microsoft: "microsoft.com",
  windows: "microsoft.com",
  google: "google.com",
  youtube: "youtube.com",
  tiktok: "tiktok.com",
  midjourney: "midjourney.com",
  capcut: "capcut.com",
};

export function getBrandDomain(title: string): string | null {
  const t = title.toLowerCase();
  for (const [key, domain] of Object.entries(DOMAIN_MAP)) {
    if (t.includes(key)) return domain;
  }
  return null;
}

export function getBrandIconUrl(brand: string, title: string): string | null {
  const searchStr = `${brand} ${title}`.toLowerCase();
  
  // 1. SVG / SimpleIcons CDN
  for (const [key, url] of Object.entries(BRAND_ICON_MAP)) {
    if (searchStr.includes(key)) return url;
  }

  // 2. icon.horse (based on domain)
  const domain = getBrandDomain(title) || getBrandDomain(brand);
  if (domain) {
    return `https://icon.horse/icon/${domain}`;
  }

  // 3. Clearbit
  const englishBrandMatch = brand.match(/[a-zA-Z0-9]+/);
  if (englishBrandMatch) {
    const b = englishBrandMatch[0].toLowerCase();
    if (b.length > 2) {
      return `https://logo.clearbit.com/${b}.com`;
    }
  }

  // 4. Fallback to Initials badge (returns null to let UI handle it)
  return null;
}
