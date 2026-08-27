import "./globals.css";
import Link from "next/link";

export const metadata = {
  metadataBase: new URL("https://gongbaekgi.vercel.app"),
  title: {
    default: "공백기 며칠째 — 아이돌 컴백 주기 추적",
    template: "%s | 공백기 며칠째",
  },
  description:
    "내 아이돌이 마지막 컴백 이후 며칠째인지, 평균 컴백 주기를 넘겼는지 한눈에.",
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
      </body>
    </html>
  );
}
