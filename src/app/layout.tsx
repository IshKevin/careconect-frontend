import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/lib/api/auth';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: "IsanoMed - Healthcare in Rwanda",
  description: "A comprehensive healthcare management platform connecting patients, doctors, and administrators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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