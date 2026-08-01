import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter, Lavishly_Yours } from "next/font/google";
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

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  display: "swap",
});

const lavishlyYours = Lavishly_Yours({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Happy Birthday Nuha",
  description: "A little wish for you \u2014 crafted with love.",
  keywords: ["birthday", "gift", "wish", "greeting", "celebration"],
  authors: [{ name: "With love" }],
  icons: {
    icon: [{ url: "/gift-box.svg", type: "image/svg+xml" }],
    apple: [{ url: "/gift-box.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Happy Birthday Nuha",
    description: "A little wish for you \u2014 crafted with love.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Happy Birthday Nuha",
    description: "A little wish for you \u2014 crafted with love.",
  },
};

export const viewport: Viewport = {
  themeColor: "#7b61ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} ${lavishlyYours.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
