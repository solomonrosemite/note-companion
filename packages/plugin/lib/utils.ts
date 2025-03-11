import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A wrapper for className strings that ensures Tailwind classes are properly prefixed
 * 
 * Since we're adding the 'fo-' prefix in tailwind.config.js, we need to use this
 * function for any string literals that directly reference Tailwind classes.
 * 
 * For example: className="bg-white p-4" becomes className={tw("bg-white p-4")}
 * Behind the scenes, this will be transformed to className="fo-bg-white fo-p-4"
 * 
 * @param classNames The Tailwind class names string or array
 * @returns The properly prefixed class string
 */
export function tw(classNames: string | string[]): string {
  // For compatibility with existing code, return empty string if no classes
  if (!classNames) return '';
  
  const classes = Array.isArray(classNames) ? classNames : classNames.split(' ');
  
  // Return classes with prefix added if they don't already have it
  return classes
    .filter(Boolean)
    .map(cls => cls.startsWith('fo-') ? cls : `fo-${cls}`)
    .join(' ');
}