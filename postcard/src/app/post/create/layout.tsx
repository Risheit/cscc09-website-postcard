"use client";
import { WebSocketProvider } from "next-ws/client";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WebSocketProvider
      url={
        process.env.NODE_ENV === "production"
          ? `wss://${process.env.NEXT_PUBLIC_BASEURL}/api/ws`
          : `ws://${process.env.NEXT_PUBLIC_BASEURL}/api/ws`
      }
    >
      {children}
    </WebSocketProvider>
  );
}
