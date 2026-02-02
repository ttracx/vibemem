import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeMem - Memory for AI Agents",
  description: "Compress conversation history, inject smart context, and give your AI agents persistent memory that actually works.",
  keywords: ["AI", "memory", "agents", "compression", "context", "LLM"],
  openGraph: {
    title: "VibeMem - Memory for AI Agents",
    description: "Compress conversation history by 70%, inject smart context, and give your agents persistent memory.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
