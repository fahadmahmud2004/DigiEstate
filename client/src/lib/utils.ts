
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to convert avatar path to full URL
export function getAvatarUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return ""
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  
  // If it's a blob URL (from file input), return as is
  if (avatarPath.startsWith('blob:')) {
    return avatarPath
  }
  
  // Convert relative path to full URL
  return `http://localhost:3001/${avatarPath}`
}

