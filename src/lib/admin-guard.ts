import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Admin gate for the ops routes. Returns a 401/403 payload or null when allowed. */
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return { status: 401, body: { ok: false, message: "ابتدا وارد حساب ادمین شوید" } };
  if (user.role !== "ADMIN") return { status: 403, body: { ok: false, message: "دسترسی ادمین لازم است" } };
  return null;
}
