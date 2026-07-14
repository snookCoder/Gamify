import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { InviteModal } from "../components/InviteModal";
import { GlobalErrorModal } from "../components/GlobalErrorModal";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PlayVerse - Real-time Multiplayer Gaming Platform",
  description: "Play Tic-Tac-Toe, Chess, and other games in real-time with friends. Lobby matching, levels, rating, global leaderboard, and live chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full dark`}>
      <body className="min-h-full font-sans antialiased text-gray-100 flex flex-col">
        {children}
        <InviteModal />
        <GlobalErrorModal />
      </body>
    </html>
  );
}
