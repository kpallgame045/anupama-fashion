import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF7F2",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://anupama-fashion.vercel.app"),
  title: "ANUPAMA FASHION | Premium Women's Clothing & Boutique",
  description:
    "Generate a quick, natural review draft for ANUPAMA FASHION. Premier women's clothing store featuring one-piece, two-piece, and luxury fashion collections.",
  keywords: [
    "Anupama Fashion",
    "women's clothing store",
    "ladies clothing",
    "one piece",
    "two piece",
    "women's fashion",
    "clothing store",
    "fashion boutique",
  ],
  openGraph: {
    title: "ANUPAMA FASHION | Review Assistant",
    description:
      "Share your authentic shopping experience at ANUPAMA FASHION. Generate an AI-assisted review draft in English or Gujarati.",
    images: [{ url: "/logo.png", width: 800, height: 800, alt: "ANUPAMA FASHION Logo" }],
    type: "website",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-brand-black text-brand-ivory antialiased selection:bg-brand-gold selection:text-brand-black">
        {children}
      </body>
    </html>
  );
}
