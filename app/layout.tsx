import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist, Prata } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/lib/theme";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const prata = Prata({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "SwapOut",
  description: "Behavioral-Based Safety (BBS) Assessment Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", geist.variable, prata.variable)}
    >
      <body className="min-h-full flex flex-col bg-background dark:bg-black text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
