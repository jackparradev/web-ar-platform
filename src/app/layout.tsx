import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Card AR",
  description: "using AR to create cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/*
          FIX #1: Scripts con strategy="afterInteractive"
          ─────────────────────────────────────────────────
          En Next.js App Router, "beforeInteractive" dentro de <head> NO funciona.
          "afterInteractive" garantiza que los scripts se cargan en el cliente
          después del hydration, lo que permite que ARViewer.tsx haga polling
          de window.AFRAME antes de montar <a-scene>.
          El orden importa: A-Frame SIEMPRE antes que MindAR.
        */}
        <Script
          id="aframe-script"
          src="https://aframe.io/releases/1.3.0/aframe.min.js"
          strategy="afterInteractive"
        />
        <Script
          id="mindar-script"
          src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
