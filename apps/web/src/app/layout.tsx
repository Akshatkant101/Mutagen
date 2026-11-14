import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Mutagen - Adaptive Boss AI Arena",
  description: "Real-time co-op game against an adaptive AI boss",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={silkscreen.variable}>
      <body className="bg-[#08080a] text-neutral-100 min-h-screen overflow-hidden font-mono select-none">
        {children}
      </body>
    </html>
  );
}

