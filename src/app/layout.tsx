import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Subflo — Subscription Tracker",
  description:
    "Open-source, AI-powered subscription tracker. Track recurring payments via email, SMS, and manual entry.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
