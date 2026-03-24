import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ather Feedback Monitor",
  description: "Monitor customer feedback for Ather scooters from Reddit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
