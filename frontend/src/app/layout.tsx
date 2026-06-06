import React from 'react';
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/providers/QueryProvider";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent";
import { Toaster } from "react-hot-toast";
import PWARegistration from "@/components/PWARegistration";
import ClientInserts from "@/components/ClientInserts";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MH App - Mess Management",
  description: "Official Mess Management App for the Men's Hostel at GEC Sreekrishnapuram. Track attendance, view bills, and stay updated.",
  keywords: ['GECSKP', 'Mess', 'Hostel', 'MH', 'GEC Sreekrishnapuram', 'Attendance'],
  authors: [{ name: 'Sabari & Roomies 2.0' }],
  creator: 'Sabari',
  publisher: 'Sabari',
  openGraph: {
    title: "MH App - Mess Management",
    description: "Official Mess Management App for the Men's Hostel.",
    url: 'https://mens-hostel-gecskp.vercel.app',
    siteName: "MH App",
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MH App - Mess Management",
    description: "Official Mess Management App for the Men's Hostel.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#5D5FEF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#5D5FEF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MH App" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MH App" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className={`${manrope.className} bg-[var(--mh-surface)] font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <Header />
            <MainContent>{children}</MainContent>
            <Toaster position="top-center" />
            <PWARegistration />
            <ClientInserts />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
