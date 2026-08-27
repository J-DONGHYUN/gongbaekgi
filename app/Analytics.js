import Script from "next/script";

/**
 * Google Analytics 4
 *
 * Vercel Web Analytics 는 쿠키 대신 하루짜리 해시로 방문자를 구분해서
 * 날짜 간 추적이 구조적으로 불가능하다 = 재방문율을 못 본다.
 * 이 제품의 핵심 가설이 "매일 돌아온다" 이므로 GA4 를 따로 붙인다.
 *
 * 측정 ID 는 브라우저에 노출되는 공개 값이라 저장소에 있어도 문제없다.
 */
const GA_ID = "G-Y3N2BGPL4J";

export default function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
