import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: { total: true },
          where: { status: "PAID" }
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    const formattedUsers = users.map((user: any) => ({
      ...user,
      password: "", // hide password
      orderCount: user._count.orders,
      totalSpent: user.orders.reduce((sum: number, order: any) => sum + order.total, 0)
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, phone, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: role || "USER",
      }
    });

    return NextResponse.json({ ok: true, user: { ...user, password: "" } });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
