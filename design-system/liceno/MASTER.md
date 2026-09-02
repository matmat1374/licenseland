# Liceno Master Design System (UI/UX Pro Max Intelligence)

**Project:** Liceno (لایسنو)  
**Archetype:** AI & Digital Subscriptions E-Commerce Platform  
**Design Stance:** Dark Bento Futuristic & High-Trust FinTech  
**Variance:** 8/10 | **Motion:** 7/10 | **Density:** 6/10

---

## 1. 🎨 Visual Style (`style`)
- **Primary Aesthetic:** Dark Glassmorphism & High-Contrast Bento Grids
- **Card Styling:** `dark:bg-slate-900/60`, `dark:border-indigo-500/20`, subtle `backdrop-blur-xl`
- **Hover Transitions:** 200ms ease-out translateY(-2px) with subtle neon border illumination (`ring-1 ring-primary/40`)
- **Surface Elevation:** Low-luminance dark backgrounds (`#0b0f19`) layered with elevated card surfaces (`#131b2e`).

---

## 2. 🌈 Color System & Tokens (`color`)
- **Background Base:** `#0b0f19` (Deep Cosmic Navy)
- **Elevated Card:** `#131b2e` (Dark Slate Card)
- **Primary Brand:** `#6366f1` (Indigo Vivid)
- **Accent & Trust:** `#10b981` (Emerald Green for Instant Delivery & Guarantees)
- **Urgency & Loss Aversion:** `#f59e0b` (Amber/Orange for 10-Minute Cart Lock & Limited Badges)
- **Text Hierarchy:**
  - Foreground: `#f8fafc` (Pure Crisp White)
  - Muted Foreground: `#94a3b8` (Neutral Slate)
  - Border Subtle: `#1e293b`

---

## 3. 🧠 UX Guidelines & Micro-Interactions (`ux`)
- **10-Minute Price Lock Timer:** Live countdown with clear visual feedback before refreshing Tether-synced prices.
- **Immediate Feedback (Optimistic UI):** Fast toast responses for cart additions and discount code copy (`WELCOME`).
- **Form Auto-Formatting:** Iranian phone numbers (09xx) formatted cleanly, instant inline validation without layout shift.
- **Zero-Friction Checkout:** Direct password or OTP dual-tab authentication.

---

## 4. 🚀 Landing Page Architecture (`landing`)
1. **Announcement & Trust Bar:** Active discount coupon + Shaparak / Zarinpal assurance strip.
2. **Interactive Hero Section:** Bold headline, social proof badge (`50,000+ users`), dual CTAs.
3. **Marquee & Featured AI Brands:** Animated showcase of ChatGPT, Claude, Gemini, Midjourney, Cursor.
4. **Category Bento Grid:** Quick access tabs ordered with AI Tools at #1 priority.
5. **Product Catalog with Filters:** Instant search, price filter, sorting.
6. **Trust Pillar Badges:** Instant automated delivery (< 5 mins), 100% money-back guarantee, 24/7 support.
7. **Blog & Educational Insights:** SEO-driven article previews with product cross-links.
8. **Comprehensive Footer:** Official Kish address, landline 07644458791, mobile 09121145687, Telegram @matinmazi.

---

## 5. 🔤 Typography Scale & Hierarchy (`typography`)
- **Persian Font Family:** Vazirmatn / Shabnam / Dana (Variable Font)
- **Heading 1:** 2.25rem (36px) - Bold 800 - Tracking tight
- **Heading 2:** 1.5rem (24px) - SemiBold 700
- **Heading 3:** 1.125rem (18px) - Medium 600
- **Body Regular:** 0.875rem (14px) - Regular 400 - Leading relaxed (1.6)
- **Monospace Numbers / LTR:** Persian numeral localization with fallback tabular digits for prices.

---

## 6. ⚡ GSAP & Motion Choreography (`gsap`)
- **Scroll Stagger:** Products reveal in staggered groups (0.08s stagger, y: 20 -> 0, opacity: 0 -> 1).
- **Smooth Drawer & Modals:** 250ms ease-out spring effect without jank.
- **Badge Pulsing:** Subtle green glow pulse on "تحویل زیر ۵ دقیقه" badges.

---

## 7. 📊 Dashboard Charts & Analytics (`chart`)
- **Revenue & Orders Trend:** Smooth Area Chart with Indigo-to-Emerald gradient fill.
- **Category Sales Distribution:** Donut Chart with glowing slices for AI vs Design vs Dev.
- **Live Tether (USDT) Rate Tracker:** Sparkline widget in Admin Header for real-time exchange rate monitoring.
