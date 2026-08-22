import { FAQS, SITE } from "@/lib/constants";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { HelpCircle, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description: "پاسخ پرتکرارترین سوالات کاربران درباره خرید لایسنس، تحویل و پشتیبانی.",
};

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HelpCircle className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black">سوالات متداول</h1>
          <p className="mt-2 text-muted-foreground">پاسخ سوالات رایج شما درباره خرید لایسنس</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <Card key={i} className="overflow-hidden p-0">
              <AccordionItem value={`item-${i}`} className="border-0">
                <AccordionTrigger className="px-5 py-4 text-right hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="px-5 pb-4 text-muted-foreground leading-7">{f.a}</AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>

        <Card className="mt-8 flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">سوال دیگری دارید؟</h2>
          <p className="text-sm text-muted-foreground">تیم پشتیبانی ما ۲۴ ساعته آماده پاسخگویی است</p>
          <div className="flex gap-2">
            <Button asChild><a href={SITE.telegram} target="_blank" rel="noreferrer">تلگرام پشتیبانی</a></Button>
            <Button asChild variant="outline"><Link href="/contact">فرم تماس</Link></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
