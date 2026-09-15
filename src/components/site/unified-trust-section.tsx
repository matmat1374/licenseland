import { ShieldCheck, Zap, Headphones, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export function UnifiedTrustSection() {
  return (
    <section className="py-16 md:py-24 bg-card border-y border-border/40 relative overflow-hidden">
      {/* Soft background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          خرید مطمئن و بی‌دردسر
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          ما در لایسنو (دفتر کیش) متعهد به ارائه لایسنس‌های ۱۰۰٪ قانونی و اورجینال هستیم. 
          روند خرید ساده است: انتخاب محصول، پرداخت امن، تحویل فوری.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">تحویل آنی سیستم</h3>
            <p className="text-sm text-muted-foreground">دریافت بلافاصله پس از پرداخت بدون معطلی.</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">تضمین اصالت و گارانتی</h3>
            <p className="text-sm text-muted-foreground">گارانتی تعویض تا آخرین روز اعتبار اشتراک شما.</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">پشتیبانی همیشگی</h3>
            <p className="text-sm text-muted-foreground">پاسخگویی سریع ۲۴ ساعته حتی در روزهای تعطیل.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/shop">
            <Button size="lg" className="rounded-xl px-8 font-bold text-base h-14">
              شروع خرید
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </Link>
          <a href={SITE.telegram} target="_blank" rel="noreferrer">
            <Button size="lg" variant="outline" className="rounded-xl px-8 font-bold text-base h-14 border-blue-500/50 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600">
              <Send className="w-5 h-5 ml-2" />
              مشاوره تلگرامی
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
