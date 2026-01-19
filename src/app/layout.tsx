import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradePilot - Automated Trading Platform",
  description: "Your intelligent trading co-pilot for options and intraday stocks on Dhan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
