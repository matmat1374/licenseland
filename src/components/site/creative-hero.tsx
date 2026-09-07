"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, MonitorPlay, Code, PenTool, LayoutTemplate, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCover } from "@/components/site/product-cover";
import { toToman } from "@/lib/format";
import { OrbitalCarousel } from "./orbital-carousel";

type CreativeHeroProps = {
  content: any;
  categories: any[];
  heroProducts: any[];
};

export function CreativeHero({ content, categories, heroProducts }: CreativeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24">
      {/* Neon/Soft gradient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col-reverse gap-12 lg:grid lg:grid-cols-2 lg:items-center">
          {/* Right/Start side Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-start text-start space-y-6 mt-8 lg:mt-0"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight tracking-tight">
              خرید قانونی اشتراک <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">هوش مصنوعی</span><br />
              از لایسنو؛ مدرن‌ترین مرجع ایران
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              {content.hero_description || "بیش از ۹۵۰ مشتری راضی. دسترسی فوری زیر ۵ دقیقه به معتبرترین ابزارهای هوش مصنوعی، طراحی و برنامه‌نویسی با تضمین ۱۰۰٪ بازگشت وجه."}
            </p>

            {/* Animated Search Bar */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="relative w-full max-w-xl mt-4 flex items-center bg-card/80 backdrop-blur-md rounded-full p-2 shadow-xl border border-primary/20 focus-within:ring-4 focus-within:ring-primary/20 transition-all duration-300"
            >
              <Search className="absolute inset-inline-start-4 h-6 w-6 text-primary" />
              <input
                type="text"
                placeholder="جستجو در بین صدها محصول..."
                className="w-full bg-transparent border-none focus:ring-0 text-base ps-12 pe-4 py-3 outline-none text-foreground placeholder:text-muted-foreground"
              />
              <Button className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                جستجو
              </Button>
            </motion.div>

            {/* Badges for top AI products / Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2.5 mt-6"
            >
              <Badge variant="secondary" className="bg-primary/10 text-primary px-3.5 py-1.5 border border-primary/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-primary/20 transition whitespace-nowrap shrink-0">
                <Sparkles className="h-4 w-4" />
                دستیار هوش مصنوعی
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 px-3.5 py-1.5 border border-blue-500/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-blue-500/20 transition whitespace-nowrap shrink-0">
                <Code className="h-4 w-4" />
                برنامه‌نویسی
              </Badge>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 px-3.5 py-1.5 border border-purple-500/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-purple-500/20 transition whitespace-nowrap shrink-0">
                <PenTool className="h-4 w-4" />
                ساخت تصویر
              </Badge>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 px-3.5 py-1.5 border border-emerald-500/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-emerald-500/20 transition whitespace-nowrap shrink-0">
                <Video className="h-4 w-4" />
                ویدیو
              </Badge>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 px-3.5 py-1.5 border border-amber-500/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-amber-500/20 transition whitespace-nowrap shrink-0">
                <LayoutTemplate className="h-4 w-4" />
                طراحی
              </Badge>
              <Badge variant="secondary" className="bg-rose-500/10 text-rose-500 px-3.5 py-1.5 border border-rose-500/20 rounded-full gap-2 font-medium shadow-sm backdrop-blur-sm cursor-pointer hover:bg-rose-500/20 transition whitespace-nowrap shrink-0">
                <MonitorPlay className="h-4 w-4" />
                استریم
              </Badge>
            </motion.div>
          </motion.div>

          {/* Left/End side Visuals (Floating Cards) */}
          <div className="relative flex h-[400px] lg:h-[600px] w-full items-center justify-center mb-8 lg:mb-0 mt-4 lg:mt-0">
            <OrbitalCarousel products={heroProducts} />
          </div>
        </div>
      </div>
    </section>
  );
}
