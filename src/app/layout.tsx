import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dhan SL Order App",
  description: "Quick Stop Loss Market Orders for Options Trading",
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
