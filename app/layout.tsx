import type { Metadata } from "next";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "./globals.css";

// Draft metadata only. Replace with Sterling-approved title, description, and OG image before packaging.
export const metadata: Metadata = {
  metadataBase: new URL("https://sterlingcreations.ai"),
  title: "Sterling Mobile-Friendly Promo Builder",
  description: "Private production tool for creating mobile-friendly website promotional images.",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Sterling Mobile-Friendly Promo Builder",
    description: "Create polished desktop-and-iPhone promotional images from any public homepage.",
    type: "website",
    images: [{ url: "/sterling-mobile-simulator-og.png", width: 1200, height: 630, alt: "Sterling Mobile-Friendly Promo Builder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sterling Mobile-Friendly Promo Builder",
    description: "Create polished desktop-and-iPhone promotional images from any public homepage.",
    images: ["/sterling-mobile-simulator-og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
