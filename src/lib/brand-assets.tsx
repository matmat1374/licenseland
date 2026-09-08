import React from "react";
import {
  Sparkles,
  Code2,
  PenTool,
  Gamepad2,
  Film,
  Music,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Terminal,
  Layers,
  Palette,
  Bot,
  Video,
  Mic,
  Headphones,
  Mail,
  Share2,
} from "lucide-react";

export interface BrandAsset {
  icon: React.ReactNode;
  accent: string;
  bgGlow: string;
  gradient: string;
  label: string;
}

export function getBrandVector(brand?: string | null, title?: string | null): BrandAsset {
  const str = `${brand || ""} ${title || ""}`.toLowerCase();

  // 1. Netflix
  if (str.includes("netflix") || str.includes("نتفلیکس")) {
    return {
      accent: "#E50914",
      bgGlow: "rgba(229,9,20,0.5)",
      gradient: "from-red-950 via-zinc-950 to-black",
      label: "Netflix 4K Ultra",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#E50914] drop-shadow-[0_0_15px_rgba(229,9,20,0.8)]">
          <path d="M4 2h4.5l5.5 13.5V2H18v20h-4.5L8 8.5V22H4V2z" />
        </svg>
      ),
    };
  }

  // 2. Adobe & Photoshop & Premiere & Express
  if (str.includes("adobe") || str.includes("ادوبی") || str.includes("photoshop") || str.includes("فتوشاپ") || str.includes("premiere") || str.includes("پریمیر") || str.includes("illustrator")) {
    return {
      accent: "#FF0000",
      bgGlow: "rgba(255,0,0,0.5)",
      gradient: "from-rose-950 via-red-950 to-zinc-950",
      label: "Adobe Creative",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#FF0000] drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
          <path d="M13.96 2H24v20H15.6l-3.3-8.8-3.7 8.8H0V2h10.04l3.92 9.6L13.96 2zM9.4 15.6L6.5 8.7H4.3v9.6h2.8l2.3-2.7zm5.2 0l2.3 2.7h2.8V8.7h-2.2l-2.9 6.9z" />
        </svg>
      ),
    };
  }

  // 3. Perplexity AI
  if (str.includes("perplexity") || str.includes("پرپلکسیتی")) {
    return {
      accent: "#20B2AA",
      bgGlow: "rgba(32,178,170,0.5)",
      gradient: "from-teal-950 via-cyan-950 to-zinc-950",
      label: "Perplexity Pro",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#20B2AA] drop-shadow-[0_0_15px_rgba(32,178,170,0.8)]">
          <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 3.2L17.5 8 12 11.2 6.5 8 12 5.2zM6 9.8l5 2.9v5.8l-5-3.1V9.8zm12 5.6l-5 3.1v-5.8l5-2.9v5.6z" />
        </svg>
      ),
    };
  }

  // 4. Kling AI
  if (str.includes("kling") || str.includes("کلینگ")) {
    return {
      accent: "#A855F7",
      bgGlow: "rgba(168,85,247,0.5)",
      gradient: "from-purple-950 via-indigo-950 to-zinc-950",
      label: "Kling AI Video",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#C084FC] drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      ),
    };
  }

  // 5. Runway AI
  if (str.includes("runway") || str.includes("ران‌وی")) {
    return {
      accent: "#10B981",
      bgGlow: "rgba(16,185,129,0.5)",
      gradient: "from-emerald-950 via-teal-950 to-zinc-950",
      label: "Runway Gen-3",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#34D399] drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
          <path d="M4 3h10a7 7 0 0 1 7 7c0 3.3-2.3 6-5.4 6.8L21 21h-5l-4.7-4H8v4H4V3zm4 7h6a3 3 0 0 0 0-6H8v6z" />
        </svg>
      ),
    };
  }

  // 6. xAI / Grok
  if (str.includes("grok") || str.includes("xai") || str.includes("گراک")) {
    return {
      accent: "#E2E8F0",
      bgGlow: "rgba(226,232,240,0.5)",
      gradient: "from-zinc-900 via-neutral-950 to-black",
      label: "xAI Grok 2",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    };
  }

  // 7. ElevenLabs
  if (str.includes("elevenlabs") || str.includes("الون‌لبز") || str.includes("الون لبز")) {
    return {
      accent: "#6366F1",
      bgGlow: "rgba(99,102,241,0.5)",
      gradient: "from-indigo-950 via-slate-950 to-zinc-950",
      label: "ElevenLabs Voice",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#818CF8] drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]">
          <path d="M7 4h3v16H7V4zm7 0h3v16h-3V4z" />
        </svg>
      ),
    };
  }

  // 8. Suno AI
  if (str.includes("suno") || str.includes("سونو")) {
    return {
      accent: "#F59E0B",
      bgGlow: "rgba(245,158,11,0.5)",
      gradient: "from-amber-950 via-orange-950 to-zinc-950",
      label: "Suno AI Music",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#FBBF24] drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    };
  }

  // 9. Udio AI
  if (str.includes("udio") || str.includes("یودیو")) {
    return {
      accent: "#D946EF",
      bgGlow: "rgba(217,70,239,0.5)",
      gradient: "from-fuchsia-950 via-purple-950 to-zinc-950",
      label: "Udio AI Music",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#E879F9] drop-shadow-[0_0_15px_rgba(217,70,239,0.8)]">
          <path d="M12 3v18c5 0 9-4 9-9s-4-9-9-9zm-2 2H6v14h4V5z" />
        </svg>
      ),
    };
  }

  // 10. TikTok
  if (str.includes("tiktok") || str.includes("تیک تاک") || str.includes("تیک‌تاک")) {
    return {
      accent: "#00F2FE",
      bgGlow: "rgba(0,242,254,0.5)",
      gradient: "from-cyan-950 via-zinc-950 to-black",
      label: "TikTok USA",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#00F2FE] drop-shadow-[0_0_15px_rgba(0,242,254,0.8)]">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.03 3.44.02 6.89-.03 10.33-.21 2.37-1.39 4.67-3.32 5.99-1.92 1.34-4.51 1.73-6.75 1.05-2.28-.68-4.25-2.45-5.07-4.66-.82-2.22-.44-4.83.98-6.68 1.4-1.85 3.73-2.94 6.06-2.86.32.01.64.04.96.08v4.14c-.45-.15-.93-.24-1.41-.24-1.28.02-2.5 .68-3.15 1.78-.66 1.1-.64 2.53.05 3.61.69 1.09 1.99 1.69 3.27 1.52 1.25-.16 2.33-.99 2.76-2.17.24-.65.3-1.35.29-2.05.02-6.52.01-13.04.01-19.56z" />
        </svg>
      ),
    };
  }

  // 11. Microsoft Outlook / Hotmail
  if (str.includes("outlook") || str.includes("hotmail") || str.includes("اوت‌لوک") || str.includes("هات‌میل")) {
    return {
      accent: "#0078D4",
      bgGlow: "rgba(0,120,212,0.5)",
      gradient: "from-sky-950 via-blue-950 to-zinc-950",
      label: "Microsoft Outlook",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#38BDF8] drop-shadow-[0_0_15px_rgba(0,120,212,0.8)]">
          <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
          <circle cx="12" cy="13" r="3" fill="#0284C7" />
        </svg>
      ),
    };
  }

  // 12. Facebook / Meta
  if (str.includes("facebook") || str.includes("فیسبوک") || str.includes("meta")) {
    return {
      accent: "#1877F2",
      bgGlow: "rgba(24,119,242,0.5)",
      gradient: "from-blue-950 via-indigo-950 to-zinc-950",
      label: "Facebook Verified",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#1877F2] drop-shadow-[0_0_15px_rgba(24,119,242,0.8)]">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    };
  }

  // 13. HeyGen
  if (str.includes("heygen") || str.includes("هی‌جن") || str.includes("هی جن")) {
    return {
      accent: "#8B5CF6",
      bgGlow: "rgba(139,92,246,0.5)",
      gradient: "from-indigo-950 via-purple-950 to-zinc-950",
      label: "HeyGen Video AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#A78BFA] drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM10 15l-3.5-4.5 2.5-3 2.5 3L10 15z" />
        </svg>
      ),
    };
  }

  // 14. Higgsfield & Seedance & Genspark
  if (str.includes("higgsfield") || str.includes("seedance") || str.includes("سیدنس") || str.includes("genspark") || str.includes("جن‌اسپارک")) {
    return {
      accent: "#EC4899",
      bgGlow: "rgba(236,72,153,0.5)",
      gradient: "from-pink-950 via-purple-950 to-zinc-950",
      label: "Creative Gen AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#F472B6] drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
          <path d="M12 2L15 9l7 3-7 3-3 7-3-7-7-3 7-3 3-7zm0 6l-1.5 3.5L7 13l3.5 1.5L12 18l1.5-3.5L17 13l-3.5-1.5L12 8z" />
        </svg>
      ),
    };
  }

  // 15. Canva
  if (str.includes("canva") || str.includes("کنوا")) {
    return {
      accent: "#00C4CC",
      bgGlow: "rgba(0,196,204,0.5)",
      gradient: "from-teal-950 via-cyan-950 to-zinc-950",
      label: "Canva Pro",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#00C4CC] drop-shadow-[0_0_15px_rgba(0,196,204,0.8)]">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 14.8c-2.4 0-4.2-1.8-4.2-4.2s1.8-4.2 4.2-4.2c1.4 0 2.5.6 3.2 1.6l-1.4 1.1c-.5-.6-1.1-.9-1.8-.9-1.3 0-2.3 1-2.3 2.4s1 2.4 2.3 2.4c.8 0 1.5-.4 2-1l1.4 1.1c-.8 1.1-2.1 1.8-3.4 1.8z" />
        </svg>
      ),
    };
  }

  // 16. ChatGPT & OpenAI
  if (str.includes("chatgpt") || str.includes("openai") || str.includes("چت جی پی تی") || str.includes("gpt")) {
    return {
      accent: "#10A37F",
      bgGlow: "rgba(16,163,127,0.5)",
      gradient: "from-emerald-950 via-teal-950 to-zinc-950",
      label: "OpenAI ChatGPT",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#10A37F] drop-shadow-[0_0_15px_rgba(16,163,127,0.8)]">
          <path d="M22.28 11.45c-.17-1.04-.6-2.01-1.25-2.83-.68-.84-1.55-1.5-2.52-1.91V6.52c0-1.12-.42-2.19-1.17-3.02C16.59 2.68 15.52 2.2 14.4 2.2H9.6c-1.12 0-2.19.48-2.94 1.3-.75.83-1.17 1.9-1.17 3.02v.19c-.97.41-1.84 1.07-2.52 1.91-.65.82-1.08 1.79-1.25 2.83-.17 1.06-.05 2.14.33 3.14.37.99.98 1.86 1.76 2.52.79.66 1.74 1.11 2.76 1.28.17 1.04.6 2.01 1.25 2.83.68.84 1.55 1.5 2.52 1.91v.19c0 1.12.42 2.19 1.17 3.02.75.82 1.82 1.3 2.94 1.3h4.8c1.12 0 2.19-.48 2.94-1.3.75-.83 1.17-1.9 1.17-3.02v-.19c.97-.41 1.84-1.07 2.52-1.91.65-.82 1.08-1.79 1.25-2.83.17-1.06.05-2.14-.33-3.14-.37-.99-.98-1.86-1.76-2.52-.79-.66-1.74-1.11-2.76-1.28zm-3.06 6.09c-.44.57-1.03 1-1.71 1.25-.06-.5-.22-.98-.48-1.42l-2.4-4.16v-4.8l2.4 4.16c.38.66.57 1.41.57 2.18v2.79zm-7.62 3.86c-.73 0-1.42-.3-1.93-.81-.51-.51-.81-1.2-.81-1.93v-3.86l3.34 1.93c.33.19.72.29 1.11.29s.78-.1 1.11-.29l1.45-.84v2.75c0 .73-.3 1.42-.81 1.93-.51.51-1.2.81-1.93.81h-1.53zm-6.27-5.11c-.57-.44-1-1.03-1.25-1.71.5.06.98.22 1.42.48l4.16 2.4-2.4 4.16-3.93-5.33zm1.61-7.79c.44-.57 1.03-1 1.71-1.25.06.5.22.98.48 1.42l2.4 4.16v4.8l-2.4-4.16c-.38-.66-.57-1.41-.57-2.18V8.5zm7.62-3.86c.73 0 1.42.3 1.93.81.51.51.81 1.2.81 1.93v3.86l-3.34-1.93c-.66-.38-1.55-.38-2.22 0l-1.45.84V7.4c0-.73.3-1.42.81-1.93.51-.51 1.2-.81 1.93-.81h1.53zm6.27 5.11c.57.44 1 1.03 1.25 1.71-.5-.06-.98-.22-1.42-.48l-4.16-2.4 2.4-4.16 3.93 5.33zm-4.32 4.41l-2.75 1.59-2.75-1.59V11.2l2.75-1.59 2.75 1.59v3.18z" />
        </svg>
      ),
    };
  }

  // 17. Claude & Anthropic
  if (str.includes("claude") || str.includes("anthropic") || str.includes("کلاود") || str.includes("آنتروپیک")) {
    return {
      accent: "#D97706",
      bgGlow: "rgba(217,119,6,0.5)",
      gradient: "from-amber-950 via-orange-950 to-zinc-950",
      label: "Claude AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#D97706] drop-shadow-[0_0_15px_rgba(217,119,6,0.8)]">
          <path d="M12 2L2 22h4l2-4h8l2 4h4L12 2zm0 4.5l3 6H9l3-6z" />
        </svg>
      ),
    };
  }

  // 18. Google, Gemini, Gmail & VEO
  if (str.includes("gemini") || str.includes("google") || str.includes("veo") || str.includes("gmail") || str.includes("جیمینی") || str.includes("گوگل")) {
    return {
      accent: "#4285F4",
      bgGlow: "rgba(66,133,244,0.5)",
      gradient: "from-blue-950 via-slate-950 to-zinc-950",
      label: "Google AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#4285F4] drop-shadow-[0_0_15px_rgba(66,133,244,0.8)]">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
      ),
    };
  }

  // 19. Cursor AI
  if (str.includes("cursor") || str.includes("کورسور")) {
    return {
      accent: "#06B6D4",
      bgGlow: "rgba(6,182,212,0.5)",
      gradient: "from-cyan-950 via-slate-900 to-zinc-950",
      label: "Cursor AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#06B6D4] drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
          <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4 11.5v6l8 4.5 8-4.5v-6l-8-1z" />
        </svg>
      ),
    };
  }

  // 20. CapCut
  if (str.includes("capcut") || str.includes("کپ کات") || str.includes("کپ‌کات")) {
    return {
      accent: "#00E5FF",
      bgGlow: "rgba(0,229,255,0.5)",
      gradient: "from-sky-950 via-cyan-950 to-zinc-950",
      label: "CapCut Pro",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#00E5FF] drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]">
          <path d="M19 4h-3.5l-2 3H10L8 4H4.5A2.5 2.5 0 002 6.5v11A2.5 2.5 0 004.5 20h15a2.5 2.5 0 002.5-2.5v-11A2.5 2.5 0 0019 4zm-7 11.5v-7l6 3.5-6 3.5z" />
        </svg>
      ),
    };
  }

  // 21. Xbox
  if (str.includes("xbox") || str.includes("ایکس‌باکس") || str.includes("ایکس باکس")) {
    return {
      accent: "#107C10",
      bgGlow: "rgba(16,124,16,0.5)",
      gradient: "from-emerald-950 via-green-950 to-zinc-950",
      label: "Xbox Game Pass",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#22C55E] drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.8 14.8c-.8.8-2 1.3-3.3 1.5l2.2-2.2c.4.3.8.5 1.1.7zm-9.6 0c.3-.2.7-.4 1.1-.7l2.2 2.2c-1.3-.2-2.5-.7-3.3-1.5zM12 4.5c2.3 0 4.3 1 5.7 2.6L14 11c-.5-.7-1.2-1.2-2-1.2s-1.5.5-2 1.2L6.3 7.1C7.7 5.5 9.7 4.5 12 4.5z" />
        </svg>
      ),
    };
  }

  // 22. Spotify
  if (str.includes("spotify") || str.includes("اسپاتیفای")) {
    return {
      accent: "#1DB954",
      bgGlow: "rgba(29,185,84,0.5)",
      gradient: "from-green-950 via-emerald-950 to-zinc-950",
      label: "Spotify Premium",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#1DB954] drop-shadow-[0_0_15px_rgba(29,185,84,0.8)]">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.308-1.758-8.793-.963-.335.077-.67-.133-.746-.469-.077-.334.132-.67.467-.747 3.808-.87 7.076-.496 9.721 1.118.295.18.388.563.208.854zm1.226-2.723c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.849-.106-.973-.517-.125-.413.108-.849.52-.973 3.632-1.102 8.147-.568 11.233 1.328.366.226.481.707.257 1.071zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.016-.129-1.165-.623-.149-.495.13-1.016.624-1.165 3.532-1.073 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.443-.838.59-1.281.324z" />
        </svg>
      ),
    };
  }

  // 23. YouTube
  if (str.includes("youtube") || str.includes("یوتیوب")) {
    return {
      accent: "#FF0000",
      bgGlow: "rgba(255,0,0,0.5)",
      gradient: "from-red-950 via-rose-950 to-zinc-950",
      label: "YouTube Premium",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#FF0000] drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    };
  }

  // 24. JetBrains
  if (str.includes("jetbrains") || str.includes("جت برینز") || str.includes("intellij") || str.includes("pycharm") || str.includes("webstorm")) {
    return {
      accent: "#FC801D",
      bgGlow: "rgba(252,128,29,0.5)",
      gradient: "from-amber-950 via-orange-950 to-zinc-950",
      label: "JetBrains Suite",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#FC801D] drop-shadow-[0_0_15px_rgba(252,128,29,0.8)]">
          <path d="M0 0v24h24V0H0zm4.7 4.1h4.9v2H4.7v-2zm0 3.6h9v2h-9v-2zm0 3.6h6.7v2H4.7v-2zm0 3.6h11.2v2H4.7v-2z" />
        </svg>
      ),
    };
  }

  // 25. Telegram
  if (str.includes("telegram") || str.includes("تلگرام")) {
    return {
      accent: "#26A5E4",
      bgGlow: "rgba(38,165,228,0.5)",
      gradient: "from-sky-950 via-cyan-950 to-zinc-950",
      label: "Telegram Premium",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#26A5E4] drop-shadow-[0_0_15px_rgba(38,165,228,0.8)]">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    };
  }

  // 26. Midjourney
  if (str.includes("midjourney") || str.includes("میدجورنی")) {
    return {
      accent: "#A78BFA",
      bgGlow: "rgba(167,139,250,0.5)",
      gradient: "from-purple-950 via-indigo-950 to-zinc-950",
      label: "Midjourney AI",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-[#A78BFA] drop-shadow-[0_0_15px_rgba(167,139,250,0.8)]">
          <path d="M12 2L3 9l9 13 9-13-9-7zm0 3.8l5.8 4.5-5.8 8.4-5.8-8.4 5.8-4.5z" />
        </svg>
      ),
    };
  }

  // Default Fallback
  return {
    accent: "#10B981",
    bgGlow: "rgba(16,185,129,0.5)",
    gradient: "from-emerald-950 via-teal-950 to-zinc-950",
    label: brand || "Liceno Official",
    icon: <KeyRound className="w-full h-full text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />,
  };
}
