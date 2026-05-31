import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Inter gives the UI a clean, modern, product-like typographic baseline.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Feature Voting Board",
  description: "Propose and vote on feature ideas your team cares about.",
};

// Root layout. Providers (HeroUI + Auth) wrap the whole tree so every client view
// shares the design-system context and one auth/token source (Req 9.1). The layout
// stays a server component and just renders the client providers. The `light`
// class pins the app to the light theme with the blue accent.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
