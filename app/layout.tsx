import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/NavClient";
import MainContainer from "@/components/MainContainer";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Praxis",
  description: "Evidence-based theory blocks for your health protocols.",
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
          href="https://fonts.googleapis.com/css2?family=Gloock&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen antialiased bg-background text-foreground">
        <AuthProvider>
          <Nav />
          <MainContainer>{children}</MainContainer>
        </AuthProvider>
      </body>
    </html>
  );
}
