"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice: number | null;
}

export interface InstagramBannerCanvasRef {
  exportToPNG: () => string;
}

interface InstagramBannerCanvasProps {
  product: Product | null;
}

export const InstagramBannerCanvas = forwardRef<InstagramBannerCanvasRef, InstagramBannerCanvasProps>(({ product }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    exportToPNG: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL("image/png");
      }
      return "";
    }
  }));

  useEffect(() => {
    if (!canvasRef.current || !product) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 1080, 1080);

    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Draw some glassmorphism shapes
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(800, 200, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(200, 800, 400, 0, Math.PI * 2);
    ctx.fill();

    // Box for text (glassmorphism effect)
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.roundRect(100, 200, 880, 680, 40);
    ctx.fill();
    ctx.stroke();

    // Draw product title
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.font = "bold 80px Tahoma, Arial, sans-serif";
    
    const words = product.title.split(' ');
    let line = '';
    let y = 350;
    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > 800 && n > 0) {
        ctx.fillText(line, 540, y);
        line = words[n] + ' ';
        y += 100;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, y);

    // Draw price
    y += 150;
    if (product.discountPrice && product.discountPrice < product.price) {
      // Original price with strikethrough
      ctx.font = "50px Tahoma, Arial, sans-serif";
      ctx.fillStyle = "#ff6b6b";
      const priceText = product.price.toLocaleString() + " تومان";
      ctx.fillText(priceText, 540, y);
      const metrics = ctx.measureText(priceText);
      ctx.beginPath();
      ctx.moveTo(540 - metrics.width / 2, y - 15);
      ctx.lineTo(540 + metrics.width / 2, y - 15);
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 4;
      ctx.stroke();

      y += 100;
      // Discounted price
      ctx.font = "bold 70px Tahoma, Arial, sans-serif";
      ctx.fillStyle = "#51cf66";
      ctx.shadowColor = "#51cf66";
      ctx.shadowBlur = 20;
      ctx.fillText(product.discountPrice.toLocaleString() + " تومان", 540, y);
      ctx.shadowBlur = 0;

      // Discount badge
      const discountPercent = Math.round((1 - product.discountPrice / product.price) * 100);
      ctx.fillStyle = "#ff0000";
      ctx.roundRect(800, y - 80, 150, 70, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Tahoma, Arial, sans-serif";
      ctx.fillText(`%${discountPercent}-`, 875, y - 30);
    } else {
      ctx.font = "bold 70px Tahoma, Arial, sans-serif";
      ctx.fillStyle = "#51cf66";
      ctx.shadowColor = "#51cf66";
      ctx.shadowBlur = 20;
      ctx.fillText(product.price.toLocaleString() + " تومان", 540, y);
      ctx.shadowBlur = 0;
    }

    // Features
    y += 120;
    ctx.font = "30px Tahoma, Arial, sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.fillText("✅ تحویل فوری | 🔒 پرداخت امن | 📞 پشتیبانی ۲۴ ساعته", 540, y);

    // Footer Watermark
    ctx.font = "40px Tahoma, Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillText("Liceno.ir", 540, 1020);

  }, [product]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full aspect-square max-w-[400px] border rounded-xl overflow-hidden shadow-xl bg-muted/20">
        <canvas 
          ref={canvasRef} 
          width={1080} 
          height={1080} 
          className="w-full h-full object-contain bg-black"
        />
        {!product && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm text-white">
            <span className="font-semibold text-lg">ابتدا یک محصول انتخاب کنید</span>
          </div>
        )}
      </div>
    </div>
  );
});

InstagramBannerCanvas.displayName = "InstagramBannerCanvas";
