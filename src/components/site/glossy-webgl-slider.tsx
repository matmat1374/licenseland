'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';

const slides = [
  {
    id: '01',
    image: '/slider/alberto.png',
    bgGradient: 'linear-gradient(320deg, #f59e0b 0%, #ea580c 50%, #8b5cf6 100%)',
    fluidColors: ['#f59e0b', '#ea580c', '#8b5cf6'],
    wordLeft: 'CLAUDE',
    wordRightTop: '3.7',
    wordRightBottom: 'SONNET',
    paragraph: 'THE WORLD\'S NUMBER ONE REASONING & CODING AI MODEL WITH UNPRECEDENTED DEPTH.\n// اشتراک رسمی Claude Pro و مدل تفکر عمیق با تحویل آنی روی ایمیل شخصی',
    link: '/shop?cat=ai'
  },
  {
    id: '02',
    image: '/slider/brain.png',
    bgGradient: 'linear-gradient(125deg, #00ff88 0%, #00d4ff 50%, #7928ca 100%)',
    fluidColors: ['#00ff88', '#00d4ff', '#7928ca'],
    wordLeft: 'CHATGPT',
    wordRightTop: 'PLUS',
    wordRightBottom: 'GPT-4O',
    paragraph: 'UNLEASH ADVANCED MULTIMODAL INTELLIGENCE WITH VOICE, VISION & DEEP RESEARCH.\n// اکانت اختصاصی ChatGPT Plus با دسترسی نامحدود به GPT-4o و مدلهای o1',
    link: '/shop?cat=ai'
  },
  {
    id: '03',
    image: '/slider/gemini.png',
    bgGradient: 'linear-gradient(160deg, #3b82f6 0%, #06b6d4 50%, #6366f1 100%)',
    fluidColors: ['#3b82f6', '#06b6d4', '#6366f1'],
    wordLeft: 'GEMINI',
    wordRightTop: '1.5',
    wordRightBottom: 'ADVANCED',
    paragraph: 'MASSIVE 1-MILLION TOKEN CONTEXT WINDOW WITH DEEP MULTIMODAL UNDERSTANDING.\n// اشتراک قانونی Gemini Advanced با کانتکست عظیم ۱ میلیون توکن و ۲ ترابایت فضای ابری',
    link: '/shop?cat=ai'
  },
  {
    id: '04',
    image: '/slider/owl.png',
    bgGradient: 'linear-gradient(125deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
    fluidColors: ['#6366f1', '#a855f7', '#06b6d4'],
    wordLeft: 'CODING',
    wordRightTop: 'AI',
    wordRightBottom: 'API ENGINES',
    paragraph: 'SUPERCHARGE YOUR DEVELOPMENT WITH CURSOR AI PRO, COPILOT & HIGH-SPEED APIS.\n// لایسنس ادیتور هوشمند Cursor Pro، گیتهاب کوپایلوت و توکنهای اختصاصی API',
    link: '/shop?cat=dev'
  },
  {
    id: '05',
    image: '/slider/youtube.png',
    bgGradient: 'linear-gradient(125deg, #ef4444 0%, #ec4899 50%, #8b5cf6 100%)',
    fluidColors: ['#ef4444', '#ec4899', '#8b5cf6'],
    wordLeft: 'YOUTUBE',
    wordRightTop: '4K',
    wordRightBottom: 'PREMIUM',
    paragraph: 'UNLIMITED 4K STREAMING, BACKGROUND PLAYBACK & ZERO INTERRUPTIONS.\n// اشتراک فمیلی و اختصاصی یوتیوب پریمیوم روی جیمیل شخصی شما با گارانتی کامل',
    link: '/shop?cat=streaming'
  },
  {
    id: '06',
    image: '/slider/lion.png',
    bgGradient: 'linear-gradient(125deg, #22c55e 0%, #10b981 50%, #06b6d4 100%)',
    fluidColors: ['#22c55e', '#10b981', '#06b6d4'],
    wordLeft: 'SPOTIFY',
    wordRightTop: 'HI-FI',
    wordRightBottom: 'PREMIUM',
    paragraph: 'STREAM OVER 100 MILLION LOSSLESS TRACKS WITH ZERO ADS & OFFLINE DOWNLOADS.\n// اشتراک اختصاصی اسپاتیفای پریمیوم با کیفیت Lossless و فعالسازی بدون نیاز به VPN',
    link: '/shop?cat=streaming'
  }
];

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  baseRadius: number;

  constructor(x: number, y: number, color: string, isMouseSplat = false) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * (isMouseSplat ? 5 : 2);
    this.vy = (Math.random() - 0.5) * (isMouseSplat ? 5 : 2);
    this.baseRadius = isMouseSplat ? Math.random() * 50 + 50 : Math.random() * 200 + 100;
    this.radius = this.baseRadius;
    this.color = color;
  }

  update(width: number, height: number, mouseX: number, mouseY: number) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -this.radius) this.x = width + this.radius;
    if (this.x > width + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = height + this.radius;
    if (this.y > height + this.radius) this.y = -this.radius;

    // React to mouse
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 300) {
      this.vx -= (dx / dist) * 0.05;
      this.vy -= (dy / dist) * 0.05;
    }

    // Dampen
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    
    // Parse hex to rgba for smooth gradient
    let hex = this.color.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

export function GlossyWebGLSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Parallax Mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-15, 15]);
  const translateX = useTransform(smoothMouseX, [-0.5, 0.5], [-30, 30]);
  const translateY = useTransform(smoothMouseY, [-0.5, 0.5], [-30, 30]);

  // Bubble parallax (moves opposite)
  const bubbleX = useTransform(smoothMouseX, [-0.5, 0.5], [40, -40]);
  const bubbleY = useTransform(smoothMouseY, [-0.5, 0.5], [40, -40]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Autoplay functionality
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Fluid Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const colors = slides[activeSlide].fluidColors;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      particles = [];
      // Create base particles
      for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          colors[i % colors.length]
        ));
      }
    };

    window.addEventListener('resize', resize);
    resize();

    // Mouse interaction for canvas
    let cvsMouseX = canvas.width / 2;
    let cvsMouseY = canvas.height / 2;

    const handleCanvasMouseMove = (e: MouseEvent) => {
      cvsMouseX = e.clientX;
      cvsMouseY = e.clientY;
      
      // Randomly spawn small splats on fast movement
      if (Math.random() > 0.8) {
        particles.push(new Particle(cvsMouseX, cvsMouseY, colors[Math.floor(Math.random() * colors.length)], true));
        if (particles.length > 30) particles.shift();
      }
    };
    window.addEventListener('mousemove', handleCanvasMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.globalCompositeOperation = 'screen';
      
      particles.forEach(p => {
        p.update(canvas.width, canvas.height, cvsMouseX, cvsMouseY);
        p.draw(ctx);
      });
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeSlide]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setActiveSlide(index);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-black text-white font-sans selection:bg-white/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Background Gradients & Canvas */}
      <AnimatePresence>
        <motion.div
          key={slides[activeSlide].bgGradient}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 -z-30"
          style={{ background: slides[activeSlide].bgGradient }}
        />
      </AnimatePresence>

      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full -z-20 opacity-80 mix-blend-screen"
      />
      
      {/* Heavy Blur Overlay for the Glossy Look */}
      <div className="absolute inset-0 -z-10 backdrop-blur-[40px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 lg:px-24 pb-8">
        
        {/* Main 3D Scene container */}
        <div className="flex-1 relative flex items-center justify-center w-full h-full max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              
              {/* Typography Background */}
              <div className="absolute w-full h-full flex flex-col justify-center items-center pointer-events-none uppercase font-black" style={{ fontFamily: 'var(--font-museomoderno, sans-serif)' }}>
                <div className="w-full flex justify-between items-center px-4 md:px-0">
                  <div className="text-[12vw] leading-none tracking-tighter text-white drop-shadow-2xl mix-blend-overlay opacity-90 translate-y-[-10%] select-none">
                    {slides[activeSlide].wordLeft}
                  </div>
                  <div className="flex flex-col items-end text-[10vw] leading-[0.85] tracking-tighter text-white drop-shadow-2xl mix-blend-overlay opacity-90 select-none">
                    <span>{slides[activeSlide].wordRightTop}</span>
                    <span>{slides[activeSlide].wordRightBottom}</span>
                  </div>
                </div>
              </div>

              {/* 3D Model Image */}
              <motion.div
                style={{ rotateX, rotateY, x: translateX, y: translateY }}
                className="relative z-20 w-3/4 max-w-[600px] h-[70vh] flex justify-center items-center perspective-1000"
              >
                <motion.img 
                  animate={{ y: [-12, 12, -12] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  src={slides[activeSlide].image} 
                  alt="3D subject" 
                  className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none select-none"
                />
              </motion.div>
              
            </motion.div>
          </AnimatePresence>

          {/* Floating Bubble */}
          <motion.img 
            style={{ x: bubbleX, y: bubbleY }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            src="/slider/bubble.png" 
            alt="Glossy Bubble" 
            className="absolute left-[10%] top-[20%] w-[15vw] min-w-[100px] max-w-[200px] object-contain opacity-80 mix-blend-screen drop-shadow-xl pointer-events-none z-30"
          />

        </div>

        {/* Bottom Bar Content */}
        <div className="relative z-40 w-full flex flex-col md:flex-row justify-between items-end gap-6 pb-4">
          
          <div className="flex items-end gap-8 flex-1">
            {/* Slide Number */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={slides[activeSlide].id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-6xl md:text-8xl font-black italic tracking-tighter"
                style={{ 
                  fontFamily: 'var(--font-museomoderno, sans-serif)',
                  WebkitTextStroke: '2px rgba(255,255,255,0.8)',
                  color: 'transparent'
                }}
              >
                {slides[activeSlide].id}
              </motion.div>
            </AnimatePresence>

            {/* Paragraph & CTA */}
            <div className="max-w-md hidden md:flex flex-col gap-4 pb-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={slides[activeSlide].paragraph}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-xs md:text-sm font-medium tracking-widest text-white/90 leading-relaxed uppercase"
                >
                  {slides[activeSlide].paragraph.split('\n')[0]}
                  <br />
                  <span className="text-white/60 lowercase font-normal tracking-normal mt-2 block" dir="rtl">
                    {slides[activeSlide].paragraph.split('\n')[1]}
                  </span>
                </motion.p>
              </AnimatePresence>

              <Link href={slides[activeSlide].link}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-2 group relative overflow-hidden rounded-[40px] border-2 border-white/50 bg-white/10 backdrop-blur-md px-8 py-3 text-sm font-bold tracking-widest text-white transition-all hover:bg-white/20 hover:border-white"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    EXPLORE <span className="text-lg leading-none font-normal" dir="rtl">خرید و فعالسازی ⚡</span>
                  </span>
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={prevSlide}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${activeSlide === idx ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                />
              ))}
            </div>
            <button 
              onClick={nextSlide}
              className="w-12 h-12 flex items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
