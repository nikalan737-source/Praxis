/** Merge class names — lightweight stand-in for clsx + tailwind-merge */
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(" ");
}
