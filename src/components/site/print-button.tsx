"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1">
      <Printer className="h-4 w-4" /> چاپ
    </Button>
  );
}
