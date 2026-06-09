"use client";

import { cn } from "@/src/lib/utils";
import { CARD_SHADOW } from "@/src/utils";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  zIndex?: string;
  overflowY?: "auto" | "hidden";
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  zIndex = "z-50",
  overflowY = "auto",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/40 flex items-center justify-center p-4",
        zIndex,
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white flex flex-col max-h-[95vh]",
          overflowY === "hidden" ? "overflow-hidden" : "overflow-y-auto",
          className,
        )}
        style={{ boxShadow: CARD_SHADOW }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
