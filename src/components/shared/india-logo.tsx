"use client";

import { cn } from "@/lib/utils";

interface IndiaLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { text: "text-lg", bar: "h-[2px] w-16", gap: "gap-0.5" },
  md: { text: "text-2xl", bar: "h-[3px] w-24", gap: "gap-1" },
  lg: { text: "text-4xl", bar: "h-[4px] w-32", gap: "gap-1" },
} as const;

export function IndiaLogo({ size = "md", className }: IndiaLogoProps) {
  const styles = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-start", styles.gap, className)}>
      <div className={cn("font-bold tracking-tight select-none", styles.text)}>
        <span className="text-saffron">India</span>
        <span className="text-navy font-extrabold">GPT</span>
      </div>
      {/* Tricolor decorative bar */}
      <div className={cn("flex w-full rounded-full overflow-hidden", styles.bar)}>
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-india-green" />
        <div className="flex-1 bg-navy" />
      </div>
    </div>
  );
}
