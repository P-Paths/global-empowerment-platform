import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Global Empowerment Platform (GEP) – Transform Members Into Funded Entrepreneurs',
  description:
    'Grow your digital influence, build your brand, and prepare for capital investment. The social growth engine that transforms entrepreneurs into fundable founders.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/favicon-192x192.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'Global Empowerment Platform (GEP) – Transform Members Into Funded Entrepreneurs',
    description:
      'Grow your digital influence, build your brand, and prepare for capital investment. The social growth engine for entrepreneurs.',
    url: 'https://globalempowerment.app',
    siteName: 'Global Empowerment Platform',
    images: [
      {
        url: 'https://globalempowerment.app/logo.png',
        width: 1200,
        height: 630,
        alt: 'Global Empowerment Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Empowerment Platform (GEP) – Transform Members Into Funded Entrepreneurs',
    description:
      'Grow your digital influence, build your brand, and prepare for capital investment. The social growth engine for entrepreneurs.',
    images: ['https://globalempowerment.app/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Global Empowerment Platform',
              url: 'https://globalempowerment.app',
              logo: 'https://globalempowerment.app/logo.png',
              description: 'Transform members into funded entrepreneurs through digital influence growth, AI-powered business coaching, and VC-ready preparation.',
              sameAs: [
                'https://www.facebook.com/globalempowerment',
                'https://www.linkedin.com/company/globalempowerment',
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <ThemeProvider>
            <ScrollToTop />
            {children}
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
