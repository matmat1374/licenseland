import { redirect } from "next/navigation";

// The bare /order path has no dedicated page; customers track their orders in
// the dashboard. Redirect instead of showing a 404.
export default function OrderIndexPage() {
  redirect("/dashboard");
}
