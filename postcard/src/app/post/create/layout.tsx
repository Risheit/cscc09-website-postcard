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
          ? `wss://${process.env.NEXTAUTH_URL}/api/ws`
          : `ws://${process.env.NEXTAUTH_URL}/api/ws`
      }
    >
      {children}
    </WebSocketProvider>
  );
}
