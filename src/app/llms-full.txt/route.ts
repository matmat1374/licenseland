import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";
import { toToman } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const [categories, products, articles] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { isActive: true },
      take: 200,
      orderBy: { salesCount: "desc" },
    }),
    db.article.findMany({
      where: { published: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const md = `# ${SITE.name} (${SITE.nameEn}) — Complete Knowledge Base & Product Directory
> ${SITE.description}

## General Information
- **Domain**: ${SITE.url}
- **Email**: ${SITE.email}
- **Telegram Support**: ${SITE.telegram}
- **Instagram**: ${SITE.instagram}
- **Phone**: ${SITE.phone}
- **Address**: ${SITE.address}
- **Payment Methods**: Iranian Debit Cards (Shetab), ZarinPal Gateway
- **Delivery Model**: Instant license code issuance immediately after online payment verification

---

## All Categories
${categories.map((c) => `### ${c.name} (Slug: ${c.slug})\n${c.description || "خرید اشتراک و لایسنس"}\nURL: ${SITE.url}/shop?cat=${c.slug}\n`).join("\n")}

---

## Full Product Catalog (${products.length} Products)
${products
  .map((p) => {
    const priceFormatted = toToman(p.discountPrice || p.price);
    return `### ${p.title}
- **URL**: ${SITE.url}/product/${p.slug}
- **Price**: ${priceFormatted} تومان
- **Category**: ${p.category}
- **Brand**: ${p.brand || "—"}
- **Duration**: ${p.duration || "—"}
- **Summary**: ${p.shortDesc}
- **Features**: ${p.features || "—"}
- **Full Description**: ${p.description.slice(0, 300)}...
`;
  })
  .join("\n")}

---

## Blog & Educational Guides
${articles.map((a) => `### ${a.title}\n- **URL**: ${SITE.url}/blog/${a.slug}\n- **Summary**: ${a.excerpt}\n`).join("\n")}
`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
