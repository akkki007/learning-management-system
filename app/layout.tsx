import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: "Skal Ventures",
  description: "Investment strategies that outperform the market",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className="font-inter antialiased"
          suppressHydrationWarning
        >
          <Navbar/>
          {children}
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
