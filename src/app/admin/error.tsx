"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin section error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-rose-500/10 p-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold">خطایی رخ داد!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          متاسفانه در بارگذاری این بخش مشکلی پیش آمد.
        </p>
      </div>
      <Button onClick={() => reset()} variant="outline" className="mt-2">
        تلاش مجدد
      </Button>
    </div>
  );
}

