"use client";

import { useState, useEffect } from "react";
import { formatJalaliDate, toFa } from "@/lib/date";
import { toToman } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Edit, Key, Eye, UserPlus, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [editModal, setEditModal] = useState<any>(null);
  const [passModal, setPassModal] = useState<any>(null);
  const [addModal, setAddModal] = useState(false);
  const [profileModal, setProfileModal] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${search}&role=${roleFilter}`);
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    const res = await fetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      setAddModal(false);
      fetchUsers();
    } else {
      alert("Error adding user");
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/admin/users/${editModal.id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      setEditModal(null);
      fetchUsers();
    } else {
      alert("Error editing user");
    }
  }

  async function handlePass(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await fetch(`/api/admin/users/${passModal.id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ password: fd.get("password") }),
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      setPassModal(null);
      alert("Password changed successfully");
    } else {
      alert("Error changing password");
    }
  }

  async function openProfile(user: any) {
    const res = await fetch(`/api/admin/users/${user.id}`);
    const data = await res.json();
    setProfileModal(data);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="جستجو (نام، ایمیل، موبایل)..." 
            className="pl-3 pr-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="border border-input bg-background rounded-md h-10 px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">همه نقش‌ها</option>
          <option value="USER">کاربر عادی</option>
          <option value="ADMIN">مدیر</option>
        </select>
        <Button onClick={() => setAddModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> افزودن مشتری
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 font-medium text-muted-foreground">کاربر</th>
              <th className="p-4 font-medium text-muted-foreground">تماس</th>
              <th className="p-4 font-medium text-muted-foreground">نقش</th>
              <th className="p-4 font-medium text-muted-foreground">عضویت</th>
              <th className="p-4 font-medium text-muted-foreground">سفارشات</th>
              <th className="p-4 font-medium text-muted-foreground">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">در حال بارگذاری...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">کاربری یافت نشد</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{user.name?.[0] || user.email?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold">{user.name || "بدون نام"}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 dir-ltr text-right">{user.phone || "-"}</td>
                <td className="p-4">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                </td>
                <td className="p-4">{formatJalaliDate(user.createdAt)}</td>
                <td className="p-4">
                  <div className="font-medium">{toFa(user.orderCount)} سفارش</div>
                  <div className="text-xs text-muted-foreground">{toToman(user.totalSpent)} تومان</div>
                </td>
                <td className="p-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openProfile(user)}><Eye className="h-4 w-4 ml-2" /> مشاهده پروفایل</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditModal(user)}><Edit className="h-4 w-4 ml-2" /> ویرایش کاربر</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPassModal(user)}><Key className="h-4 w-4 ml-2" /> تغییر رمز عبور</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setAddModal(false)} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-bold mb-4">افزودن کاربر جدید</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><label className="text-sm block mb-1">نام و نام خانوادگی</label><Input name="name" required /></div>
              <div><label className="text-sm block mb-1">ایمیل</label><Input name="email" type="email" required /></div>
              <div><label className="text-sm block mb-1">شماره موبایل</label><Input name="phone" /></div>
              <div><label className="text-sm block mb-1">رمز عبور</label><Input name="password" type="password" required minLength={6} /></div>
              <div><label className="text-sm block mb-1">نقش</label>
                <select name="role" className="w-full border border-input bg-background rounded-md h-10 px-3">
                  <option value="USER">کاربر عادی</option>
                  <option value="ADMIN">مدیر</option>
                </select>
              </div>
              <Button type="submit" className="w-full">ثبت کاربر</Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setEditModal(null)} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-bold mb-4">ویرایش کاربر</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div><label className="text-sm block mb-1">نام</label><Input name="name" defaultValue={editModal.name || ""} required /></div>
              <div><label className="text-sm block mb-1">ایمیل</label><Input name="email" type="email" defaultValue={editModal.email || ""} required /></div>
              <div><label className="text-sm block mb-1">موبایل</label><Input name="phone" defaultValue={editModal.phone || ""} /></div>
              <div><label className="text-sm block mb-1">نقش</label>
                <select name="role" defaultValue={editModal.role} className="w-full border border-input bg-background rounded-md h-10 px-3">
                  <option value="USER">کاربر عادی</option>
                  <option value="ADMIN">مدیر</option>
                </select>
              </div>
              <Button type="submit" className="w-full">ذخیره تغییرات</Button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setPassModal(null)} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <h3 className="text-lg font-bold mb-4">تغییر رمز عبور</h3>
            <p className="text-sm text-muted-foreground mb-4">در حال تغییر رمز عبور برای {passModal.email}</p>
            <form onSubmit={handlePass} className="space-y-4">
              <div><label className="text-sm block mb-1">رمز عبور جدید</label><Input name="password" type="password" required minLength={6} /></div>
              <Button type="submit" className="w-full">بروزرسانی رمز</Button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
            <button onClick={() => setProfileModal(null)} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">پروفایل کاربر</h3>
              <div className="mt-4 flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">{profileModal.name?.[0] || profileModal.email?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-lg">{profileModal.name || "بدون نام"}</div>
                  <div className="text-muted-foreground">{profileModal.email}</div>
                  <div className="text-muted-foreground mt-1 text-sm dir-ltr text-right">{profileModal.phone}</div>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h4 className="font-bold mb-4">سفارشات اخیر</h4>
              {profileModal.orders?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">سفارشی ثبت نشده است</div>
              ) : (
                <div className="space-y-3">
                  {profileModal.orders?.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <div className="font-bold font-mono">{o.code}</div>
                        <div className="text-xs text-muted-foreground">{formatJalaliDate(o.createdAt)}</div>
                      </div>
                      <div className="text-left">
                        <Badge variant="outline">{o.status}</Badge>
                        <div className="text-sm font-bold mt-1">{toToman(o.total)} تومان</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
