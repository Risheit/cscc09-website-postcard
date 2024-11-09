"use client";
import dynamic from "next/dynamic";

const SimpleCanvasV2 = dynamic(
  () => import("./components/SimpleCanvasV2/SimpleCanvasV2"),
  {
    ssr: false,
  }
);

export default function Page() {
  return (
    <>
      <SimpleCanvasV2 />
    </>
  );
}
