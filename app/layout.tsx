import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={instrumentSans.variable}>{children}</body>
    </html>
  );
}
