import { Metadata } from "next";
import { PricingDashboard } from "@/components/admin/pricing-dashboard";

export const metadata: Metadata = {
  title: "داشبورد نرخ ارز و ترب | پنل مدیریت",
};

export const dynamic = "force-dynamic";

export default function AdminPricingPage() {
  return <PricingDashboard />;
}
