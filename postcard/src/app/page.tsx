"use client";
import dynamic from "next/dynamic";

const SimpleCanvas = dynamic(
  () => import("./components/SimpleCanvas/SimpleCanvas"),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <>
      <SimpleCanvas />
    </>
  );
}
