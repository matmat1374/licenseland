"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Code2, 
  Palette, 
  Image as ImageIcon, 
  Youtube, 
  Music, 
  Gamepad2, 
  Shield, 
  Video,
  FileText
} from "lucide-react";

export function ArticleCover({
  title,
  category,
  className,
}: {
  title: string;
  category?: string;
  className?: string;
}) {
  const t = title.toLowerCase();
  
  let icon = <FileText className="h-20 w-20" />;
  let colorFrom = "from-zinc-500";
  let colorTo = "to-zinc-800";
  let shadow = "shadow-zinc-500/20";
  let topic = "General";

  if (t.includes("claude")) {
    icon = <Bot className="h-20 w-20" />;
    colorFrom = "from-orange-500"; colorTo = "to-red-700"; shadow = "shadow-orange-500/30"; topic = "Claude AI";
  } else if (t.includes("chatgpt") || t.includes("gpt")) {
    icon = <MessageSquare className="h-20 w-20" />;
    colorFrom = "from-emerald-400"; colorTo = "to-teal-700"; shadow = "shadow-emerald-500/30"; topic = "ChatGPT";
  } else if (t.includes("gemini")) {
    icon = <Sparkles className="h-20 w-20" />;
    colorFrom = "from-blue-400"; colorTo = "to-indigo-700"; shadow = "shadow-blue-500/30"; topic = "Google Gemini";
  } else if (t.includes("cursor")) {
    icon = <Code2 className="h-20 w-20" />;
    colorFrom = "from-slate-400"; colorTo = "to-slate-800"; shadow = "shadow-slate-500/30"; topic = "Cursor IDE";
  } else if (t.includes("midjourney")) {
    icon = <Palette className="h-20 w-20" />;
    colorFrom = "from-purple-500"; colorTo = "to-indigo-900"; shadow = "shadow-purple-500/30"; topic = "Midjourney";
  } else if (t.includes("canva")) {
    icon = <ImageIcon className="h-20 w-20" />;
    colorFrom = "from-cyan-400"; colorTo = "to-blue-700"; shadow = "shadow-cyan-500/30"; topic = "Canva";
  } else if (t.includes("youtube")) {
    icon = <Youtube className="h-20 w-20" />;
    colorFrom = "from-red-500"; colorTo = "to-red-900"; shadow = "shadow-red-500/30"; topic = "YouTube";
  } else if (t.includes("spotify")) {
    icon = <Music className="h-20 w-20" />;
    colorFrom = "from-green-400"; colorTo = "to-green-800"; shadow = "shadow-green-500/30"; topic = "Spotify";
  } else if (t.includes("xbox")) {
    icon = <Gamepad2 className="h-20 w-20" />;
    colorFrom = "from-green-500"; colorTo = "to-emerald-900"; shadow = "shadow-green-500/30"; topic = "Xbox";
  } else if (t.includes("nordvpn") || t.includes("vpn")) {
    icon = <Shield className="h-20 w-20" />;
    colorFrom = "from-blue-500"; colorTo = "to-blue-900"; shadow = "shadow-blue-500/30"; topic = "NordVPN";
  } else if (t.includes("veo")) {
    icon = <Video className="h-20 w-20" />;
    colorFrom = "from-rose-400"; colorTo = "to-red-700"; shadow = "shadow-rose-500/30"; topic = "VEO AI";
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-zinc-950", className)}>
      {/* Cyber Mesh Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
      
      {/* Neon Gradient Glow */}
      <div className={cn("absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[80px] opacity-60", colorFrom, colorTo, "bg-gradient-to-br")}></div>
      <div className={cn("absolute -left-20 -bottom-20 h-64 w-64 rounded-full blur-[80px] opacity-40", colorTo, colorFrom, "bg-gradient-to-tr")}></div>

      {/* Glass Container */}
      <div className="absolute inset-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
        {/* 3D Icon Container */}
        <div className={cn("relative flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br p-[2px] shadow-2xl transition-transform hover:scale-110", colorFrom, colorTo, shadow)}>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 to-transparent opacity-50 mix-blend-overlay blur-[1px]"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-[22px] bg-black/80 backdrop-blur-md">
            <div className={cn("text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]")}>
              {icon}
            </div>
          </div>
        </div>
        
        {/* Category Badge */}
        {(category || topic) && (
          <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
            {category || topic}
          </div>
        )}
      </div>
    </div>
  );
}
