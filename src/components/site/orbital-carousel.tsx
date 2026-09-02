"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCover } from "@/components/site/product-cover";
import { toToman } from "@/lib/format";
import { toFa } from "@/lib/date";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Product = any;

export function OrbitalCarousel({ products }: { products: Product[] }) {
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mounted, setMounted] = useState(false);
  const n = products.length;

  useEffect(() => {
    setMounted(true);
    const checkResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkResize();
    window.addEventListener("resize", checkResize);
    return () => window.removeEventListener("resize", checkResize);
  }, []);

  useEffect(() => {
    if (isHovered || n === 0 || !mounted) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, n, mounted]);

  const nextSlide = () => {
    setRotation(r => r - (360 / n));
    setActiveIndex((prev) => (prev + 1) % n);
  };

  const prevSlide = () => {
    setRotation(r => r + (360 / n));
    setActiveIndex((prev) => (prev - 1 + n) % n);
  };

  const goToSlide = (index: number) => {
    let diff = activeIndex - index;
    // Optimize rotation direction
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;
    
    setRotation(r => r + diff * (360 / n));
    setActiveIndex(index);
  };

  if (n === 0 || !mounted) return null;

  return (
    <div 
      className="relative flex h-full min-h-[400px] lg:h-[600px] w-full items-center justify-center overflow-hidden [perspective:1200px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Holographic Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute h-[160px] w-[160px] lg:h-[260px] lg:w-[260px] rounded-full border border-primary/40 bg-primary/20 blur-[8px] lg:blur-[4px]"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute h-[260px] w-[260px] lg:h-[360px] lg:w-[360px] rounded-full border-2 border-dashed border-primary/60 z-0 opacity-80"
        />
        {/* Floating Particles / Cyber Glow */}
        <div className="absolute h-32 w-32 lg:h-40 lg:w-40 bg-primary/50 rounded-full blur-[60px] lg:blur-[80px]" />
      </div>

      <div className="relative w-full h-full flex items-center justify-center [transform-style:preserve-3d]">
        {products.map((p, i) => {
          // calculate base angle for this item
          const baseAngle = (i * (360 / n));
          // target angle is baseAngle + current rotation
          const currentAngle = baseAngle + rotation;
          const currentAngleRad = (currentAngle * Math.PI) / 180;

          // 3D Orbit parameters
          let radiusX = 260;
          let radiusZ = 160;
          if (isMobile) {
            radiusX = 130;
            radiusZ = 80;
          } else if (isTablet) {
            radiusX = 180;
            radiusZ = 110;
          }

          const x = Math.sin(currentAngleRad) * radiusX;
          const z = Math.cos(currentAngleRad) * radiusZ;
          
          // scale and opacity based on Z depth
          // z goes from -radiusZ (back) to +radiusZ (front)
          // normalize z to 0-1 (0 is back, 1 is front)
          const normalizedZ = (z + radiusZ) / (2 * radiusZ);
          
          const scale = 0.75 + (normalizedZ * 0.4); // 0.75 to 1.15
          const opacity = 0.3 + (normalizedZ * 0.7); // 0.3 to 1.0
          const zIndex = Math.round(normalizedZ * 100);
          const isFront = normalizedZ > 0.8;

          return (
            <motion.div
              key={p.id}
              initial={false}
              animate={{ 
                x: x, 
                z: z, 
                scale: scale, 
                opacity: opacity,
                filter: isFront ? "blur(0px)" : "blur(3px)",
              }}
              transition={{ type: "spring", stiffness: 120, damping: 25, mass: 1 }}
              onClick={() => !isFront && goToSlide(i)}
              className={`absolute w-[200px] sm:w-[240px] md:w-[260px] lg:w-[280px] rounded-2xl border border-white/20 bg-background/50 backdrop-blur-xl p-4 shadow-2xl transition-colors duration-300 ${isFront ? 'cursor-default shadow-primary/40 ring-2 ring-primary/80 bg-background/70' : 'cursor-pointer hover:border-primary/50 hover:bg-background/60'}`}
              style={{ 
                zIndex: zIndex,
              }}
            >
              <ProductCover
                title={p.title}
                brand={p.brand}
                seed={p.slug}
                className="mb-4 aspect-[4/3] w-full rounded-xl object-cover shadow-inner"
              />
              <div className="line-clamp-1 text-lg font-bold text-foreground text-start">{p.title}</div>
              
              <AnimatePresence>
                {isFront && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[11px] font-bold">
                        <Zap className="h-3 w-3 mr-1 inline" /> تحویل فوری
                      </Badge>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="price-number text-2xl font-black text-primary drop-shadow-sm">{toFa(toToman(p.price))}</span>
                  <span className="text-sm font-bold text-muted-foreground">تومان</span>
                </div>
                
                <AnimatePresence>
                  {isFront && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Link href={`/product/${p.slug}`} className="w-full block">
                        <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold shadow-lg shadow-primary/25 border-0 transition-transform active:scale-95">
                          خرید سریع
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-20 flex gap-2 z-50">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'w-2 bg-primary/30 hover:bg-primary/60'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 flex gap-4 z-50">
        <Button 
          variant="outline" 
          size="icon"
          onClick={prevSlide}
          className="rounded-full bg-background/50 backdrop-blur-md border-white/20 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all shadow-lg hover:scale-110 active:scale-95 h-12 w-12"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          onClick={nextSlide}
          className="rounded-full bg-background/50 backdrop-blur-md border-white/20 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all shadow-lg hover:scale-110 active:scale-95 h-12 w-12"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
