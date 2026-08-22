import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const sp = await searchParams;
  const coupon = sp.coupon || "";
  return <CheckoutClient coupon={coupon} />;
}
