import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getExplicitTabIndex(tabIndex?: number, disabled?: boolean) {
  if (disabled) return -1
  return tabIndex ?? 0
}
