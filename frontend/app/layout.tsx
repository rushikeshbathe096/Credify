import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credify — AI Loan Officer",
  description:
    "AI-powered loan officer that explains every decision. Apply in 15 minutes via video interview.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-[#050D1E] text-white font-sans">
        {children}
      </body>
    </html>
  );
}
