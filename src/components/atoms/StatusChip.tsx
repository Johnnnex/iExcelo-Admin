"use client";

import { cn } from "@/src/lib/utils";

interface StatusChipProps {
  label: string;
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  className?: string;
}

const variantStyles = {
  success: "bg-[#E7F6EC] text-[#036B26]",
  error: "bg-[#FBEAE9] text-[#D42620]",
  warning: "bg-[#FEF6E7] text-[#865503]",
  info: "bg-[#E3EFFC] text-[#0D5EBA]",
  neutral: "bg-[#F0F2F5] text-[#344054]",
};

const StatusChip = ({
  label,
  variant = "neutral",
  className,
}: StatusChipProps) => (
  <span
    className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      variantStyles[variant],
      className,
    )}
  >
    {label}
  </span>
);

export { StatusChip };
