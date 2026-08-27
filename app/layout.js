import "./globals.css";
import Link from "next/link";
import Analytics from "./Analytics";
import { SITE_URL, SITE_NAME, VERIFY } from "../lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "공백기 며칠째 — 아이돌 컴백 주기 추적",
    template: "%s | 공백기 며칠째",
  },
  description:
    "내 아이돌이 마지막 컴백 이후 며칠째인지, 평균 컴백 주기를 넘겼는지 한눈에.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og/home.png", width: 1200, height: 630 }],
  },
  // 1200x630 이미지가 있으므로 작은 카드가 아니라 큰 카드로 띄운다
  twitter: { card: "summary_large_image", images: ["/og/home.png"] },
  // 값이 채워진 것만 태그로 나간다
  verification: {
    ...(VERIFY.google ? { google: VERIFY.google } : {}),
    ...(VERIFY.naver ? { other: { "naver-site-verification": VERIFY.naver } } : {}),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <div className="wrap">
          <header className="topbar">
            <Link href="/" className="brand">
              공백기 <span>며칠째</span>
            </Link>
            <nav>
              <Link href="/">전체</Link>
              <Link href="/guide/">계산 방식</Link>
            </nav>
          </header>
          {children}
          <footer>
            공백기 며칠째 · Apple Music 카탈로그 자동 집계<br />
            정규·미니 앨범만 컴백으로 셉니다. 자동 집계라 실제와 다를 수 있습니다 —{" "}
            <Link href="/guide/">계산 방식 보기</Link>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
