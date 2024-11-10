import type { Metadata } from "next";
import "./globals.css";

import { Lexend } from "next/font/google";
const lexend = Lexend({ subsets: ["latin"] });

// fontawesome
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

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
          <Header />

          <div id="content" className="flex place-self-center justify-center">
            {children}
          </div>

          <div className="flex-grow"></div>
        </div>
        <Footer />
      </body>
    </html>
  );
}
