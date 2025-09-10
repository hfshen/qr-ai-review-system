import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header'
import PWAProvider from '@/components/PWAProvider'
import { AccessibilityProvider, VoiceInputProvider } from '@/lib/accessibility'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI 자동 리뷰 플랫폼",
  description: "QR 코드로 간편하게 리뷰를 작성하고 AI가 자동으로 리뷰를 생성해주는 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI 리뷰 플랫폼",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "AI 리뷰 플랫폼",
    title: "AI 자동 리뷰 플랫폼",
    description: "QR 코드로 간편하게 리뷰를 작성하고 AI가 자동으로 리뷰를 생성해주는 플랫폼",
  },
  twitter: {
    card: "summary",
    title: "AI 자동 리뷰 플랫폼",
    description: "QR 코드로 간편하게 리뷰를 작성하고 AI가 자동으로 리뷰를 생성해주는 플랫폼",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-167x167.png", sizes: "167x167", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AccessibilityProvider>
          <VoiceInputProvider>
            <PWAProvider>
              <div className="min-h-screen gradient-bg">
                <Header />
                
                {/* Main Content */}
                <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
              </div>
            </PWAProvider>
          </VoiceInputProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}