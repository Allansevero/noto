"use client"

import { cn } from "@/lib/utils"

interface PlaceholderCardProps {
  className?: string
  height?: string
}

export function PlaceholderCard({ className, height = "h-[185px]" }: PlaceholderCardProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-zinc-900/40 p-5 flex items-center justify-center select-none transition-all",
        height,
        className
      )}
    >
      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tracking-tight">
        Em breve
      </span>
    </div>
  )
}
