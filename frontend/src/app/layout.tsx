import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import SidebarWrapper from "@/components/SidebarWrapper";
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Global Empowerment Platform (GEP) – Transform Members Into Funded Entrepreneurs',
  description:
    'Grow your digital influence, build your brand, and prepare for capital investment. The social growth engine that transforms entrepreneurs into fundable founders.',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Theme initialization script - runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Public pages that should always use light mode
                  const publicPages = ['/', '/about', '/how-it-works', '/pricing', '/demo', '/register', '/login', '/terms', '/privacy', '/cookies', '/contact', '/qa', '/beta-signup', '/get-paid'];
                  const currentPath = window.location.pathname;
                  const isPublicPage = publicPages.includes(currentPath) || currentPath.startsWith('/auth');
                  
                  // Public pages always use light mode
                  if (isPublicPage) {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // Authenticated pages use theme preference
                    const theme = localStorage.getItem('theme');
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    const isDark = theme === 'dark' || (!theme && prefersDark);
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
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
            <SidebarProvider>
              <SidebarWrapper>
                <ScrollToTop />
                {children}
              </SidebarWrapper>
              <Analytics />
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
