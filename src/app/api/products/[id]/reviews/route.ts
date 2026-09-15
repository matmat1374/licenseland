import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "لطفاً ابتدا وارد حساب کاربری خود شوید" },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body = await req.json();
    const { rating, comment, isQuestion } = body;

    if (!comment || typeof comment !== "string" || comment.trim().length < 3 || comment.length > 1000) {
      return NextResponse.json(
        { ok: false, message: "متن نظر/پرسش باید بین ۳ تا ۱۰۰۰ کاراکتر باشد." },
        { status: 400 }
      );
    }

    const isQ = Boolean(isQuestion);
    const finalRating = isQ ? 0 : Number(rating);
    if (!isQ && (isNaN(finalRating) || finalRating < 1 || finalRating > 5)) {
      return NextResponse.json(
        { ok: false, message: "امتیاز نامعتبر است." },
        { status: 400 }
      );
    }

    // Check if user purchased this product
    const orderItem = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: { in: ['COMPLETED', 'PAID'] },
        }
      }
    });
    
    const hasPurchased = !!orderItem;

    const review = await db.review.create({
      data: {
        productId,
        userId: session.user.id,
        authorName: session.user.name || session.user.phone || "کاربر لایسنو",
        rating: finalRating,
        comment: comment.trim(),
        verified: hasPurchased,
        approved: true,
      }
    });

    // Recalculate rating
    const allApproved = await db.review.findMany({
      where: { productId, approved: true }
    });
    
    const rated = allApproved.filter(r => r.rating > 0);
    const avgRating = rated.length > 0
      ? Number((rated.reduce((sum, r) => sum + r.rating, 0) / rated.length).toFixed(1))
      : null;
      
    await db.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviewCount: allApproved.length
      }
    });

    return NextResponse.json(
      { ok: true, review, rating: avgRating, reviewCount: allApproved.length },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { ok: false, message: "خطایی رخ داده است. لطفاً دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
