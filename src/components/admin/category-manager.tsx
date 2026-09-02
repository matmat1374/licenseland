"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Save, GripVertical } from "lucide-react";
import { updateCategoriesOrder } from "@/app/admin/categories/actions";
import { toast } from "sonner";

export function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index - 1];
    newCats[index - 1] = temp;
    setCategories(newCats);
  };

  const moveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index + 1];
    newCats[index + 1] = temp;
    setCategories(newCats);
  };

  const saveOrder = async () => {
    setLoading(true);
    const items = categories.map((c, i) => ({ id: c.id, sortOrder: i + 1 }));
    const res = await updateCategoriesOrder(items);
    setLoading(false);
    if (res.success) {
      toast.success("ترتیب دسته‌بندی‌ها با موفقیت ذخیره شد.");
    } else {
      toast.error("خطا در ذخیره‌سازی ترتیب.");
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-6">
        {categories.map((c, idx) => (
          <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <span className="font-bold">{c.name}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{c.slug}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => moveUp(idx)} disabled={idx === 0}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => moveDown(idx)} disabled={idx === categories.length - 1}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={saveOrder} disabled={loading} className="w-full">
        {loading ? "در حال ذخیره..." : "ذخیره ترتیب جدید"}
        {!loading && <Save className="ml-2 h-4 w-4" />}
      </Button>
    </Card>
  );
}

