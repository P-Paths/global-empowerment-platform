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
  title: 'Accorria – #1 Trust-Native Listing Platform',
  description:
    'The future of selling starts here. Secure listings, instant escrow, and AI-powered posting for cars, homes, and high-value items. Upload photos, we\'ll flip the rest.',
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
    title: 'Accorria – #1 Trust-Native Listing Platform',
    description:
      'The future of selling starts here. Secure listings, instant escrow, and AI-powered posting for cars, homes, and high-value items.',
    url: 'https://accorria.com',
    siteName: 'Accorria',
    images: [
      {
        url: 'https://accorria.com/LogoinBLUEONEword.png',
        width: 1200,
        height: 630,
        alt: 'Accorria - Trust-Native Listing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accorria – #1 Trust-Native Listing Platform',
    description:
      'The future of selling starts here. Secure listings, instant escrow, and AI-powered posting for cars, homes, and high-value items.',
    images: ['https://accorria.com/LogoinBLUEONEword.png'],
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
              name: 'Accorria',
              url: 'https://accorria.com',
              logo: 'https://accorria.com/LogoinBLUEONEword.png',
              description: 'The future of selling starts here. Secure listings, instant escrow, and AI-powered posting for cars, homes, and high-value items.',
              sameAs: [
                'https://www.facebook.com/accorria',
                'https://www.linkedin.com/company/accorria',
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
