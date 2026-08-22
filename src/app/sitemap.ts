import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.article.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, priority: 1, changeFrequency: "daily" },
    { url: `${SITE.url}/shop`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE.url}/blog`, lastModified: now, priority: 0.8, changeFrequency: "daily" },
    { url: `${SITE.url}/about`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE.url}/contact`, lastModified: now, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE.url}/faq`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${SITE.url}/terms`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE.url}/privacy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/product/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE.url}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    priority: 0.6,
    changeFrequency: "monthly",
  }));

  return [...staticPages, ...productPages, ...articlePages];
}
