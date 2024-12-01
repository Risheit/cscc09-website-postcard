"use client";
import { WebSocketProvider } from "next-ws/client";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WebSocketProvider url="ws://localhost:3000/api/ws">
      {children}
    </WebSocketProvider>
  );
}
