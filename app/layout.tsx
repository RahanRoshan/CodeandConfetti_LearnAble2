import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import Script from "next/script";

import "@/styles/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "LearnAble",
  description:
    "Simplify complex lessons, translate them, listen back, and turn them into quick quizzes.",
};

const themeScript = `
  try {
    const storedTheme = window.localStorage.getItem("learnable-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : prefersDark
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={instrumentSans.variable}>
        <Script
          id="learnable-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
