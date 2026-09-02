import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تماس با ما | لایسنو",
  description: "راه‌های ارتباطی با پشتیبانی ۲۴ ساعته لایسنو، تلگرام، واتساپ و فرم تماس.",
  alternates: { canonical: `${SITE.url}/contact` },
  openGraph: {
    title: "تماس با ما | لایسنو",
    description: "ارتباط سریع با تیم پشتیبانی و فروش لایسنو",
    url: `${SITE.url}/contact`,
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "تماس با لایسنو",
    description: "پشتیبانی ۲۴ ساعته لایسنو",
    url: `${SITE.url}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      email: SITE.email,
      telephone: SITE.phone,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: SITE.phone,
        email: SITE.email,
        availableLanguage: ["Persian", "English"],
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactLd).replace(/</g, '\\u003c') }}
      />
      {children}
    </>
  );
}


