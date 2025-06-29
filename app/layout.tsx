import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMEC AI",
  description: "AI-powered solutions for SMEs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-metropolis antialiased">
        {children}
      </body>
    </html>
  );
}
