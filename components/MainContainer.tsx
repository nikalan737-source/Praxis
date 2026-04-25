"use client";

import { usePathname } from "next/navigation";

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <>{children}</>;
  }

  return <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>;
}
