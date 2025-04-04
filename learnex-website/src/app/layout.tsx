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
    url: "https://learnex.vercel.app",
    siteName: "Learnex",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Learnex - Transform Your Learning Experience",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
