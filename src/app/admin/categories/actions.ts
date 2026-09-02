"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateCategoriesOrderSchema = z.array(z.object({
  id: z.string(),
  sortOrder: z.number()
}));

export async function updateCategoriesOrder(items: { id: string; sortOrder: number }[]) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateCategoriesOrderSchema.safeParse(items);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    for (const item of parsed.data) {
      await db.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      });
    }
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

