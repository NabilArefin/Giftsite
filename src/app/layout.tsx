import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter, Germania_One, Sacramento, Updock, Lavishly_Yours, Allura, Ballet, Petit_Formal_Script, MonteCarlo, Cormorant_Garamond, Montserrat } from "next/font/google";
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

const germaniaOne = Germania_One({
  variable: "--font-germania",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const sacramento = Sacramento({
  variable: "--font-sacramento",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const updock = Updock({
  variable: "--font-updock",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const lavishlyYours = Lavishly_Yours({
  variable: "--font-lavishly",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const ballet = Ballet({
  variable: "--font-ballet",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const petitFormalScript = Petit_Formal_Script({
  variable: "--font-petit-formal",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const monteCarlo = MonteCarlo({
  variable: "--font-monte-carlo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lavishly+Yours&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} ${germaniaOne.variable} ${sacramento.variable} ${updock.variable} ${lavishlyYours.variable} ${allura.variable} ${ballet.variable} ${petitFormalScript.variable} ${monteCarlo.variable} ${cormorantGaramond.variable} ${montserrat.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
