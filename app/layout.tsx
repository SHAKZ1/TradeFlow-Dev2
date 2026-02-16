import type { Metadata } from "next";
import { Inter } from "next/font/google"; // <--- SWITCH TO INTER
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { ScrollToTop } from "./components/ScrollToTop";

// Configure Inter (The "Apple-like" Font)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // We use variable font, so we don't need to specify weights
});

export const metadata: Metadata = {
  title: "TradeFlow UK",
  description: "Automated Growth for UK Trades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
        elements: {
            footerAction: "hidden"
        }
    }}>
      <html lang="en">
        <body id="top" className={`${inter.variable} antialiased`}>
          <ScrollToTop />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}