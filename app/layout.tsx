import type { Metadata } from "next";
import "./globals.css";
import { getNonce } from "../lib/nonce";

export const metadata: Metadata = {
  title: "SMEC AI",
  description: "AI-powered solutions for SMEs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = await getNonce();
  
  return (
    <html lang="en">
      <head>
        {nonce && <script nonce={nonce} dangerouslySetInnerHTML={{__html: ""}} />}
      </head>
      <body className="font-metropolis antialiased">
        {children}
      </body>
    </html>
  );
}
