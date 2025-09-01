import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learnex - Transform Your Learning Experience",
  description: "Learnex is a powerful learning platform designed to enhance your educational experience with interactive features and adaptive learning paths.",
  keywords: ["learning", "education", "e-learning", "adaptive learning", "interactive learning"],
  authors: [{ name: "Learnex Team" }],
  creator: "Learnex",
  openGraph: {
    title: "Learnex - Transform Your Learning Experience",
    description: "Immersive learning platform with adaptive and interactive features.",
    url: "https://learnex-web.vercel.app",
    siteName: "Learnex",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Learnex - Transform Your Learning Experience",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  other: {
    'apple-itunes-app': 'app-id=1234567890, app-argument=learnex://',
    'al:ios:app_store_id': '1234567890',
    'al:ios:app_name': 'Learnex',
    'al:ios:url': 'learnex://',
    'al:android:package': 'com.learnex',
    'al:android:url': 'learnex://',
    'al:android:app_name': 'Learnex',
    'al:web:url': 'https://learnex-web.vercel.app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-itunes-app" content="app-id=1234567890, app-argument=learnex://" />
        <meta property="al:ios:app_store_id" content="1234567890" />
        <meta property="al:ios:app_name" content="Learnex" />
        <meta property="al:ios:url" content="learnex://" />
        <meta property="al:android:package" content="com.learnex" />
        <meta property="al:android:url" content="learnex://" />
        <meta property="al:android:app_name" content="Learnex" />
        <meta property="al:web:url" content="https://learnex-web.vercel.app" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
