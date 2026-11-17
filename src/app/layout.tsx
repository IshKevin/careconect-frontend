import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/api/auth';
import Providers from '@/components/Providers';

// Inter is downloaded at build time and served from our own domain (no request to Google from the browser).
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const viewport: Viewport = { themeColor: "#0f7a70" };

export const metadata: Metadata = {
  title: "IsanoMed - Healthcare in Rwanda",
  description: "Book doctors, hold secure video consultations and pay for care in Rwanda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}