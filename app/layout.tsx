import type { Metadata } from "next";
import { Inter, Geist, Space_Grotesk, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/authContext";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque"
});

export const metadata: Metadata = {
  title: "Universitifier",
  description: "Universitifier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${bricolage.variable}`}>
      <body className={inter.variable} style={{ fontFamily: 'var(--font-inter)' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
