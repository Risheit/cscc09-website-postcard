import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

import { Lexend } from "next/font/google";
const lexend = Lexend({ subsets: ["latin"] });

// fontawesome
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { NextAuthProvider } from "./components/NextAuthProvider/NextAuthProvider";

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
    <html lang="en" className="no-scrollbar">
      <body className={lexend.className}>
        <div className="min-h-[100vh] flex flex-col">
          <NextAuthProvider>
            <Header />

            <div
              id="content"
              className="flex place-self-center justify-center w-full bg-background-100"
            >
              {children}
            </div>
          </NextAuthProvider>

          <div className="flex-grow bg-background-100"></div>
        </div>
        <Footer />
      </body>
    </html>
  );
}
