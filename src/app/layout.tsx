import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CartDrawer } from "@/components/site/cart-drawer";
import { AiAdvisor } from "@/components/site/ai-advisor";
import { SITE } from "@/lib/constants";
import { Toaster } from "sonner";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "خرید لایسنس",
    "لایسنس اوریجینال",
    "لایسنس ChatGPT",
    "اکانت پریمیوم Midjourney",
    "لایسنس CapCut",
    "لایسنس Adobe",
    "خرید اکانت هوش مصنوعی",
    "بازار لایسنس ایران",
    "تحویل آنی لایسنس",
    SITE.name,
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  verification: {
    google: "google838a39fcd6d96c2f",
    other: {
      "google-site-verification": "google838a39fcd6d96c2f",
    },
  },
};

import { SocialProofToast } from "@/components/site/social-proof-toast";

export const viewport = {
  themeColor: "#0a0f0d",
  width: "device-width",
  initialScale: 1,
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  alternateName: SITE.nameEn,
  url: SITE.url,
  logo: `${SITE.url}/logo.svg`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+98-76-44458791",
    contactType: "customer support",
    areaServed: "IR",
    availableLanguage: ["Persian", "English"],
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kish Island",
    streetAddress: SITE.address,
    addressCountry: "IR",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/shop?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body
        className={`${vazir.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <Providers>
          <SiteHeader />
          <main className="flex-1 flex flex-col pb-24 md:pb-0">{children}</main>
          <SiteFooter />
          <AiAdvisor />
          <CartDrawer />
          <SocialProofToast />
          <Toaster position="top-center" dir="rtl" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
