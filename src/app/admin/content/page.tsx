import { db } from "@/lib/db";
import { DEFAULT_CONTENT, CONTENT_FIELDS } from "@/lib/content";
import { ContentManager } from "@/components/admin/content-manager";

export const metadata = { title: "مدیریت محتوا | پنل مدیریت" };

export default async function AdminContentPage() {
  const rows = await db.siteContent.findMany();
  const map: Record<string, string> = { ...DEFAULT_CONTENT };
  for (const r of rows) {
    if (r.value !== null && r.value !== undefined) map[r.key] = r.value;
  }

  // Build groups of fields by group name, preserving definition order
  const groups: { name: string; fields: typeof CONTENT_FIELDS }[] = [];
  for (const f of CONTENT_FIELDS) {
    let g = groups.find((x) => x.name === f.group);
    if (!g) {
      g = { name: f.group, fields: [] };
      groups.push(g);
    }
    g.fields.push(f);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">مدیریت محتوا</h1>
        <p className="text-sm text-muted-foreground">
          متن‌های اصلی سایت را بدون نیاز به کدنویسی ویرایش کنید
        </p>
      </div>

      <ContentManager initialContent={map} groups={groups} />
    </div>
  );
}
