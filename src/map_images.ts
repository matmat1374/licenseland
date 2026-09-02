import { db } from "./lib/db";

const domainMap: Record<string, string> = {
  "openai": "openai.com",
  "chatgpt": "openai.com",
  "midjourney": "midjourney.com",
  "anthropic": "anthropic.com",
  "claude": "anthropic.com",
  "perplexity": "perplexity.ai",
  "grammarly": "grammarly.com",
  "leonardo": "leonardo.ai",
  "bytedance": "capcut.com", // capcut
  "capcut": "capcut.com",
  "adobe": "adobe.com",
  "microsoft": "microsoft.com",
  "xbox": "xbox.com",
  "windows": "microsoft.com",
  "office": "microsoft.com",
  "tonec": "internetdownloadmanager.com", // idm
  "idm": "internetdownloadmanager.com",
  "spotify": "spotify.com",
  "google": "google.com",
  "youtube": "youtube.com",
  "netflix": "netflix.com",
  "nord": "nordvpn.com",
  "nordvpn": "nordvpn.com",
  "kaspersky": "kaspersky.com",
  "malwarebytes": "malwarebytes.com",
  "steam": "steampowered.com",
  "sony": "playstation.com",
  "playstation": "playstation.com",
  "psn": "playstation.com",
  "canva": "canva.com",
  "wondershare": "wondershare.com",
  "filmora": "wondershare.com",
  "techsmith": "techsmith.com",
  "camtasia": "techsmith.com",
  "figma": "figma.com",
  "pubg": "pubgmobile.com",
  "uc": "pubgmobile.com",
  "telegram": "telegram.org",
  "ستاره تلگرام": "telegram.org",
  "tinder": "tinder.com",
  "discord": "discord.com",
  "nitro": "discord.com",
  "duolingo": "duolingo.com",
  "zoom": "zoom.us",
  "apple": "apple.com",
  "itunes": "apple.com",
  "amazon": "amazon.com",
  "twitch": "twitch.tv",
  "skype": "skype.com",
  "mcafee": "mcafee.com",
  "avast": "avast.com",
  "expressvpn": "expressvpn.com",
  "surfshark": "surfshark.com",
  "roblox": "roblox.com",
  "minecraft": "minecraft.net",
  "vbucks": "epicgames.com",
  "fortnite": "epicgames.com",
  "epic": "epicgames.com",
  "ea": "ea.com",
  "nintendo": "nintendo.com",
  "garena": "garena.com",
  "free fire": "garena.com",
  "riot": "riotgames.com",
  "valorant": "riotgames.com",
  "mobile legends": "mobilelegends.com",
  "clash of clans": "supercell.com",
  "brawl stars": "supercell.com",
  "supercell": "supercell.com",
  "hbo": "hbo.com",
  "max": "max.com",
  "disney": "disneyplus.com",
  "hulu": "hulu.com",
  "crunchyroll": "crunchyroll.com",
  "paramount": "paramountplus.com",
  "peacock": "peacocktv.com",
  "soundcloud": "soundcloud.com",
  "tidal": "tidal.com",
  "dezzer": "deezer.com",
  "freepik": "freepik.com",
  "envato": "envato.com",
  "shutterstock": "shutterstock.com",
  "tradingview": "tradingview.com",
  "linkedin": "linkedin.com",
  "coursera": "coursera.org",
  "udemy": "udemy.com",
  "skillshare": "skillshare.com",
  "github": "github.com",
  "jetbrains": "jetbrains.com",
  "autodesk": "autodesk.com",
  "corel": "coreldraw.com"
};

async function main() {
  const products = await db.product.findMany();
  let updated = 0;
  
  for (const p of products) {
    const textToSearch = ((p.brand || "") + " " + (p.title || "")).toLowerCase();
    let matchedDomain = null;
    
    // Check from longest key to shortest to match more specific things first
    const keys = Object.keys(domainMap).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (textToSearch.includes(k)) {
        matchedDomain = domainMap[k];
        break;
      }
    }
    
    if (matchedDomain) {
      const imgUrl = `https://logo.clearbit.com/${matchedDomain}`;
      await db.product.update({
        where: { id: p.id },
        data: { image: imgUrl }
      });
      updated++;
    }
  }
  
  console.log(`Updated ${updated} products with logos!`);
}

main().finally(() => process.exit(0));
