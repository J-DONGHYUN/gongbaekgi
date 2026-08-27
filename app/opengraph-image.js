import { ImageResponse } from "next/og";
import { artists } from "../lib/data";
import { analyze } from "../lib/calc";
import { SITE_URL, SITE_NAME } from "../lib/site";
import { loadFont } from "../lib/og-font";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [bold, regular] = await Promise.all([loadFont(700), loadFont(400)]);

  // 공백기가 가장 긴 세 팀을 미리보기로 — 링크만 봐도 무슨 사이트인지 알게 한다
  const top = artists
    .map((a) => ({ ...a, r: analyze(a.comebacks) }))
    .filter((a) => a.r.enough)
    .sort((x, y) => y.r.hiatus - x.r.hiatus)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0E0E13",
          padding: "50px 68px 42px",
          fontFamily: "NotoKR",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: "#F2F2F7",
              letterSpacing: "-0.035em",
            }}
          >
            우리 애 며칠째 쉬고 있나
          </div>
          <div style={{ fontSize: 25, color: "#8A94A6", marginTop: 10 }}>
            마지막 컴백 이후 지난 날과 평균 컴백 주기를 비교해서 보여줍니다
          </div>
        </div>

        {/* 지금 가장 오래 기다리는 세 팀 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {top.map((a) => (
            <div
              key={a.slug}
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                borderTop: "1px solid #22262F",
                paddingTop: 13,
                paddingBottom: 13,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#E6E6EE" }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 22, color: "#6E7684", marginLeft: 12 }}>
                  {a.nameKo}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div style={{ fontSize: 46, fontWeight: 700, color: "#F0914E" }}>
                  {a.r.hiatus.toLocaleString("ko-KR")}
                </div>
                <div style={{ fontSize: 24, color: "#8A94A6", marginLeft: 8 }}>일째</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 26, color: "#6E7684" }}>
            {`아이돌 ${artists.length}팀`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#E6E6EE" }}>{SITE_NAME}</div>
            <div style={{ fontSize: 23, color: "#6E7684", marginTop: 4 }}>
              {SITE_URL.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoKR", data: bold, weight: 700, style: "normal" },
        { name: "NotoKR", data: regular, weight: 400, style: "normal" },
      ],
    }
  );
}
