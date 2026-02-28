import type { Metadata, Viewport } from "next";
import ClientProviders from "@/components/providers/ClientProviders";
import "./globals.css";

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
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
