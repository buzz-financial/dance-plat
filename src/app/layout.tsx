import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext"; // ✅ Import your provider

import "./globals.css";

export const metadata: Metadata = {
  title: 'Buzz Music',
  description: 'Cool app description',
  icons: {
    icon: '/favicon.png',
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider> {/* ✅ Wrap everything inside here */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
