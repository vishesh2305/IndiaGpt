import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and resolves Tailwind CSS conflicts
 * with tailwind-merge. This is the standard shadcn/ui utility function.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * cn("px-4 py-2", "px-6") // => "px-6 py-2"
 * cn("text-red-500", condition && "text-blue-500") // conditional classes
 * cn("bg-white", { "bg-black": isDark }) // object syntax
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
