import type { Metadata, Viewport } from "next";
import { Bebas_Neue, IBM_Plex_Mono, Barlow } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-head",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const barlow = Barlow({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#00d4c8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Atlas CRE",
  description: "Commercial real estate parcel intelligence — interactive maps, parcel data, LLC entity lookup, and saved collections.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AtlasCRE",
  },
  openGraph: {
    title: "Atlas CRE",
    description: "Commercial real estate parcel intelligence",
    type: "website",
    siteName: "Atlas CRE",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${bebasNeue.variable} ${ibmPlexMono.variable} ${barlow.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
