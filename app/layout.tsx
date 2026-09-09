import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "트립보드 — 친구랑 같이 모으는 여행 위시리스트",
  description: "가고 싶은 디저트·카페·장소를 캡쳐해서 올리고 코멘트로 같이 골라요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
