import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SuiProvider } from "@/providers/sui-provider";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Porta | The Great Migration",
  description: "Inter-Protocol Highway for Sui - Move your DeFi positions with one click",
  keywords: ["Sui", "DeFi", "Migration", "Navi", "Scallop", "Magma", "PTB"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-sans`}
      >
        <SuiProvider>
          <div className="min-h-screen bg-grid">
            {children}
          </div>
        </SuiProvider>
      </body>
    </html>
  );
}
