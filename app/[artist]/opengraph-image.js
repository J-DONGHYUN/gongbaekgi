import { ImageResponse } from "next/og";
import { artists, getArtist } from "../../lib/data";
import { analyze, STATE_LABEL } from "../../lib/calc";
import { SITE_URL, SITE_NAME } from "../../lib/site";
import { loadFont } from "../../lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return artists.map((a) => ({ artist: a.slug }));
}

const COLOR = {
  inCycle: "#4FC79C",
  soon: "#6BA8F5",
  overdue: "#F0914E",
  none: "#7B8698",
};

export default async function Image({ params }) {
  const { artist: slug } = await params;
  const artist = getArtist(slug);
  const a = analyze(artist.comebacks);

  const [bold, regular] = await Promise.all([loadFont(700), loadFont(400)]);

  const tone = a.last ? (a.enough ? COLOR[a.state] : COLOR.none) : COLOR.none;
  const headline = !a.last
    ? "컴백 기록 없음"
    : a.enough && a.state === "overdue"
      ? `평균보다 ${a.over.toLocaleString("ko-KR")}일 더 기다리는 중`
      : a.enough
        ? STATE_LABEL[a.state]
        : `컴백 ${artist.comebacks.length}회 · 데이터 부족`;

  // 최근 4번의 간격 + 진행 중인 공백기
  const past = (a.gapList ?? []).slice(-4);
  const series = a.last ? [...past, a.hiatus] : [];
  const peak = Math.max(...series, 1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0E0E13",
          padding: "56px 72px 44px",
          fontFamily: "NotoKR",
        }}
      >
        {/* 위 — 아티스트 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 46, fontWeight: 700, color: "#F2F2F7", letterSpacing: "-0.02em" }}>
            {artist.name}
          </div>
          {artist.nameKo ? (
            <div style={{ fontSize: 26, color: "#7B8698", marginTop: 4 }}>{artist.nameKo}</div>
          ) : null}
        </div>

        {/* 가운데 — 숫자 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div
              style={{
                fontSize: 200,
                fontWeight: 700,
                color: tone,
                lineHeight: 1,
                letterSpacing: "-0.045em",
              }}
            >
              {a.hiatus != null ? a.hiatus.toLocaleString("ko-KR") : "—"}
            </div>
            <div style={{ fontSize: 58, fontWeight: 700, color: "#98A2B3", marginLeft: 12, marginBottom: 18 }}>
              일째
            </div>
          </div>
          <div style={{ fontSize: 36, color: tone, marginTop: 34 }}>{headline}</div>
        </div>

        {/* 아래 — 간격 막대 + 서명 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", height: 64, width: 300 }}>
            {series.map((g, i) => (
              <div
                key={i}
                style={{
                  width: 40,
                  height: Math.max(7, Math.round((g / peak) * 64)),
                  background: i === series.length - 1 ? tone : "#282C38",
                  borderRadius: 4,
                  marginRight: 10,
                }}
              />
            ))}
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
