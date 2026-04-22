import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nemit's Blog",
  description: "Personal blog with Korean and English posts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-stone-50 dark:bg-neutral-950 antialiased">
        {children}
        <Script
          src="https://dooraybiz.dooray.com/dist/ai-script/index.js?token=yxGG7gPJrHOEwfO4XuafBEG5S6KxFJcTmXEJ8mGdbbs"
          strategy="afterInteractive"
        />
        <dooray-ai-chat token="" domain="https://dooraybiz.dooray.com" allow="nemit0.github.io" />
      </body>
    </html>
  );
}
