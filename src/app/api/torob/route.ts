import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        title: true,
        slug: true,
        price: true,
        discountPrice: true,
        image: true,
        stock: true,
      }
    });

    const torobProducts = products.map((p) => {
      const price = Number(p.discountPrice || p.price);
      const oldPrice = p.discountPrice ? Number(p.price) : undefined;
      
      const isAvailable = true;

      return {
        title: p.title,
        page_url: SITE.url + "/product/" + p.slug,
        price: price,
        old_price: oldPrice,
        availability: isAvailable ? "instock" : "outofstock",
        image_link: p.image?.startsWith("http") ? p.image : undefined,
      };
    });

    return NextResponse.json(torobProducts);
  } catch (error) {
    console.error("Torob feed error:", error);
    return new NextResponse("Error generating feed", { status: 500 });
  }
}
