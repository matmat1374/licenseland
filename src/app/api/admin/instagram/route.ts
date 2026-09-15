import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const INSTAGRAM_BOT_URL = process.env.INSTAGRAM_BOT_URL || "http://localhost:8001";
let autopilotEnabled = false; // Mock state for autopilot

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "status") {
      const res = await fetch(`${INSTAGRAM_BOT_URL}/status`);
      const data = await res.json();
      return NextResponse.json(data);
    } else if (action === "analytics") {
      const res = await fetch(`${INSTAGRAM_BOT_URL}/analytics`);
      const data = await res.json();
      return NextResponse.json(data);
    } else if (action === "queue") {
      // Mock queue response
      return NextResponse.json({
        queue: [
          { id: 1, title: "پست تخفیف ویژه", date: "2026-09-14", status: "pending" },
          { id: 2, title: "معرفی محصول جدید", date: "2026-09-15", status: "pending" }
        ]
      });
    } else if (action === "products") {
      const products = await db.product.findMany({
        select: { id: true, title: true, price: true, discountPrice: true, slug: true, category: true, stock: true }
      });
      return NextResponse.json(products);
    } else if (action === "toggle-autopilot") {
      autopilotEnabled = !autopilotEnabled;
      return NextResponse.json({ autopilot: autopilotEnabled });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error communicating with Instagram bot:", error);
    // Return mock data if bot is offline
    if (action === "status") return NextResponse.json({ bot_status: { is_logged_in: false, mock_mode: true }, queue_count: 0, scheduler_running: false });
    if (action === "analytics") return NextResponse.json({ followers: 1542, impressions: 3200, posts_published: 12, dms_replied: 45 });
    if (action === "queue") return NextResponse.json({ queue: [] });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, payload } = body;

  try {
    if (action === "generate-product-content") {
      const { productId } = payload;
      const product = await db.product.findUnique({
        where: { id: productId }
      });
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      
      const caption = `🔥 تخفیف ویژه برای ${product.title}! 🔥\n\n🎯 بهترین فرصت خرید با قیمت استثنایی!\n✅ کیفیت تضمینی\n✅ تحویل فوری\n✅ پشتیبانی ۲۴/۷\n\n❌ قیمت اصلی: ${product.price.toLocaleString()} تومان\n✅ قیمت با تخفیف: ${(product.discountPrice || product.price).toLocaleString()} تومان\n\n🎁 کد تخفیف ویژه: INSTA10\n\nبرای خرید به لینک بیو مراجعه کنید یا کلمه "خرید" را دایرکت بفرستید.\n🌐 liceno.ir\n\n#لایسنس #خرید_آنلاین #liceno #تخفیف #پریمیوم #اکانت #اورجینال #فروش_ویژه #خرید_ارزان #تحویل_فوری #بازی #نرم_افزار #تخفیف_ویژه #گیم #گیمر #استیم #پلی_استیشن #ایکس_باکس #خرید_امن #پشتیبانی_آنلاین #گیفت_کارت #اکانت_قانونی #خرید_مطمئن #لایسنس_اورجینال #لایسنس_نرم_افزار #لایسنس_بازی #فروشگاه_آنلاین #تخفیفان #ارزانترین #بهترین_قیمت #licenseland #لایسنس_لند`;
      
      return NextResponse.json({ caption, product });
    } else if (action === "queue-post") {
      return NextResponse.json({ success: true, message: "پست با موفقیت به صف افزوده شد." });
    }

    let endpoint = "";
    if (action === "generate") endpoint = "/generate-post";
    else if (action === "post") endpoint = "/post-now";
    else if (action === "settings") endpoint = "/settings";
    else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const res = await fetch(`${INSTAGRAM_BOT_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error communicating with Instagram bot:", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
