import type { Metadata } from "next";
import "./globals.css";

import { Lexend } from "next/font/google";
const lexend = Lexend({ subsets: ["latin"] });

// fontawesome
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Postcard",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={lexend.className}>
        <div className="min-h-[100vh] flex flex-col">
          <header className="h-12 flex place-items-center border-b border-background-300 p-2">
            Header
          </header>

          <div
            id="content"
            className="flex place-items-center justify-center p-2"
          >
            {children}
          </div>

          <div className="flex-grow"></div>

          <footer className="h-12 flex place-items-center border-t border-background-300 p-2">
            Footer
          </footer>
        </div>
      </body>
    </html>
  );
}
