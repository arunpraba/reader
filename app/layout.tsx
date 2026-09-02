import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, THEMES } from "../lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Margin — Immersive Markdown Reader",
  description:
    "Read, listen, repeat, and revisit your saved Markdown documents.",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME_ID)};var themes=${JSON.stringify(
  Object.fromEntries(THEMES.map((t) => [t.id, t.kind])),
)};var id=localStorage.getItem(k);if(!themes[id])id=d;var root=document.documentElement;root.setAttribute("data-theme",id);root.setAttribute("data-theme-kind",themes[id]);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="stylesheet" href={`${basePath}/katex-fonts.css`} />
        <link rel="stylesheet" href={`${basePath}/reader-highlights.css`} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
