import { UserManager } from "@/components/admin/user-manager";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت مشتریان و کاربران</h1>
      </div>
      <UserManager />
    </div>
  );
}
