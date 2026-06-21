import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happy Birthday, Dear \u00b7 A Little Gift",
  description:
    "A little birthday wish, wrapped in sparkles, cake, and a whole lot of love. Tap to open your gift.",
  keywords: ["birthday", "gift", "wish", "greeting", "celebration"],
  authors: [{ name: "With love" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Happy Birthday, Dear",
    description: "A little birthday wish, just for you.",
    siteName: "A Little Gift",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy Birthday, Dear",
    description: "A little birthday wish, just for you.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
