import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatOSNumber(numero: number | string): string {
  const num = typeof numero === "string" ? Number.parseInt(numero) : numero
  return `OS-${String(num).padStart(4, "0")}`
}
