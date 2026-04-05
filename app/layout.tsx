import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/NavClient";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Praxis",
  description: "Evidence-based theory blocks for your health experiments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gloock&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen antialiased bg-background text-foreground">
        <AuthProvider>
          <Nav />
          <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
