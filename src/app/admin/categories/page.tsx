import { db } from "@/lib/db";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "مدیریت دسته‌بندی‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">مدیریت دسته‌بندی‌ها</h1>
        <p className="text-sm text-muted-foreground">
          برای تغییر ترتیب نمایش، دسته‌بندی‌ها را بکشید و رها کنید (Drag & Drop).
        </p>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
