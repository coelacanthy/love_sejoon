import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "세준이의 체스 탐험",
  description: "백세준 어린이를 위한 오프닝·전술 학습 체스 게임",
  openGraph: { title: "세준이의 체스 탐험", description: "생각하고 · 발견하고 · 성장하자!", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "세준이의 체스 탐험", description: "백세준 어린이를 위한 체스 학습 게임", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
