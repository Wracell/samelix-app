import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SamElix",
  description:
    "Instantly search for supply items, check prices, build orders, and manage your pricelist inventory — all in one beautiful interface.",
  keywords: "supplies, pricelist, price lookup, order, inventory, school supplies",
  icons: {
    icon: "/samelix.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
