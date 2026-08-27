/**
 * OG 이미지 생성 — public/og/*.png
 *
 *   npm run og      이미지만 다시 만들기
 *   npm run build   빌드 전에 자동 실행됨
 *
 * 왜 Next 의 opengraph-image 규칙을 안 쓰나:
 *   output: export 로 내보내면 확장자 없는 파일(`out/aespa/opengraph-image`)이 되고,
 *   정적 호스팅이 Content-Type 을 application/octet-stream 으로 준다.
 *   그러면 트위터·카카오가 이미지로 인식하지 못한다.
 *   그래서 진짜 .png 파일로 직접 떨어뜨린다.
 *
 * 폰트 받기에 실패하면 기존 파일을 그대로 두고 넘어간다. 빌드를 깨뜨리지 않기 위해서다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, STATE_LABEL } from "../lib/calc.js";
import { slugify } from "../lib/slug.js";
import { SITE_URL, SITE_NAME } from "../lib/site.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/og");
const SIZE = { width: 1200, height: 630 };

const raw = JSON.parse(await readFile(resolve(ROOT, "data/artists.json"), "utf8"));
const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const COLOR = {
  inCycle: "#4FC79C",
  soon: "#6BA8F5",
  overdue: "#F0914E",
  none: "#7B8698",
};
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

// ── 폰트: 실제로 쓰는 글자만 부분집합으로 받는다 (수 MB → 수십 KB) ──────────
const GLYPHS = [
  ...new Set(
    [
      "일째 평균보다 더 기다리는 중 활동 주기 안 슬슬 나올 때",
      "데이터 부족 컴백 기록 없음 회 공백기 며칠째",
      "우리 애 쉬고 있나 마지막 이후 지난 날과 평균 주기를 비교해서 보여줍니다 아이돌 팀",
      SITE_NAME, DOMAIN, "0123456789,.·—-'",
      ...artists.map((a) => `${a.name}${a.nameKo ?? ""}`),
    ].join("")
  ),
].join("");

async function loadFont(weight) {
  const api =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}` +
    `&text=${encodeURIComponent(GLYPHS)}`;
  // 구형 안드로이드인 척하면 ttf 를 준다.
  //   satori 는 woff2 를 못 읽고, IE 계열 UA 는 EOT 를 돌려주므로 둘 다 안 된다.
  const css = await fetch(api, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebKit/534.30",
    },
  }).then((r) => r.text());
  const m = css.match(/src:\s*url\(([^)]+)\)/);
  if (!m) throw new Error("폰트 URL 을 찾지 못했습니다");
  return fetch(m[1]).then((r) => r.arrayBuffer());
}

// ── JSX 없이 엘리먼트를 만든다 (.mjs 라서) ────────────────────────────────
const box = (style, children) => ({ type: "div", props: { style, children } });
const txt = (style, children) => ({ type: "div", props: { style, children } });

function artistCard(artist) {
  const a = analyze(artist.comebacks);
  const tone = a.last ? (a.enough ? COLOR[a.state] : COLOR.none) : COLOR.none;
  const headline = !a.last
    ? "컴백 기록 없음"
    : a.enough && a.state === "overdue"
      ? `평균보다 ${a.over.toLocaleString("ko-KR")}일 더 기다리는 중`
      : a.enough
        ? STATE_LABEL[a.state]
        : `컴백 ${artist.comebacks.length}회 · 데이터 부족`;

  const past = (a.gapList ?? []).slice(-4);
  const series = a.last ? [...past, a.hiatus] : [];
  const peak = Math.max(...series, 1);

  return box(
    {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      background: "#0E0E13", padding: "56px 72px 44px", fontFamily: "NotoKR",
    },
    [
      box({ display: "flex", flexDirection: "column", alignItems: "center" }, [
        txt({ fontSize: 46, fontWeight: 700, color: "#F2F2F7", letterSpacing: "-0.02em" }, artist.name),
        txt({ fontSize: 26, color: "#7B8698", marginTop: 4 }, artist.nameKo ?? ""),
      ]),
      box({ display: "flex", flexDirection: "column", alignItems: "center" }, [
        box({ display: "flex", alignItems: "flex-end" }, [
          txt(
            { fontSize: 200, fontWeight: 700, color: tone, lineHeight: 1, letterSpacing: "-0.045em" },
            a.hiatus != null ? a.hiatus.toLocaleString("ko-KR") : "—"
          ),
          txt({ fontSize: 58, fontWeight: 700, color: "#98A2B3", marginLeft: 12, marginBottom: 18 }, "일째"),
        ]),
        txt({ fontSize: 36, color: tone, marginTop: 34 }, headline),
      ]),
      box({ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }, [
        box(
          { display: "flex", alignItems: "flex-end", height: 64, width: 300 },
          series.map((g) =>
            box({
              display: "flex",
              width: 40,
              height: Math.max(7, Math.round((g / peak) * 64)),
              background: g === series[series.length - 1] ? tone : "#282C38",
              borderRadius: 4, marginRight: 10,
            }, undefined)
          )
        ),
        box({ display: "flex", flexDirection: "column", alignItems: "flex-end" }, [
          txt({ fontSize: 30, fontWeight: 700, color: "#E6E6EE" }, SITE_NAME),
          txt({ fontSize: 23, color: "#6E7684", marginTop: 4 }, DOMAIN),
        ]),
      ]),
    ]
  );
}

function homeCard() {
  const top = artists
    .map((a) => ({ ...a, r: analyze(a.comebacks) }))
    .filter((a) => a.r.enough)
    .sort((x, y) => y.r.hiatus - x.r.hiatus)
    .slice(0, 3);

  return box(
    {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", background: "#0E0E13",
      padding: "50px 68px 42px", fontFamily: "NotoKR",
    },
    [
      box({ display: "flex", flexDirection: "column" }, [
        txt({ fontSize: 54, fontWeight: 700, color: "#F2F2F7", letterSpacing: "-0.035em" }, "우리 애 며칠째 쉬고 있나"),
        txt({ fontSize: 25, color: "#8A94A6", marginTop: 10 }, "마지막 컴백 이후 지난 날과 평균 컴백 주기를 비교해서 보여줍니다"),
      ]),
      box({ display: "flex", flexDirection: "column" },
        top.map((a) =>
          box({
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            borderTop: "1px solid #22262F", paddingTop: 13, paddingBottom: 13,
          }, [
            box({ display: "flex", alignItems: "flex-end" }, [
              txt({ fontSize: 32, fontWeight: 700, color: "#E6E6EE" }, a.name),
              txt({ fontSize: 22, color: "#6E7684", marginLeft: 12 }, a.nameKo ?? ""),
            ]),
            box({ display: "flex", alignItems: "flex-end" }, [
              txt({ fontSize: 46, fontWeight: 700, color: "#F0914E" }, a.r.hiatus.toLocaleString("ko-KR")),
              txt({ fontSize: 24, color: "#8A94A6", marginLeft: 8 }, "일째"),
            ]),
          ])
        )
      ),
      box({ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }, [
        txt({ fontSize: 26, color: "#6E7684" }, `아이돌 ${artists.length}팀`),
        box({ display: "flex", flexDirection: "column", alignItems: "flex-end" }, [
          txt({ fontSize: 30, fontWeight: 700, color: "#E6E6EE" }, SITE_NAME),
          txt({ fontSize: 23, color: "#6E7684", marginTop: 4 }, DOMAIN),
        ]),
      ]),
    ]
  );
}

// ── 실행 ──────────────────────────────────────────────────────────────────
let fonts;
try {
  const [bold, regular] = await Promise.all([loadFont(700), loadFont(400)]);
  fonts = [
    { name: "NotoKR", data: bold, weight: 700, style: "normal" },
    { name: "NotoKR", data: regular, weight: 400, style: "normal" },
  ];
} catch (err) {
  console.warn(`\n⚠ 폰트를 받지 못했습니다 (${err.message}).`);
  console.warn("  기존 public/og 이미지를 그대로 두고 넘어갑니다.\n");
  process.exit(0);
}

const { ImageResponse } = await import("next/og.js");
await mkdir(OUT, { recursive: true });

async function render(name, element) {
  const res = new ImageResponse(element, { ...SIZE, fonts });
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(resolve(OUT, `${name}.png`), buf);
  return buf.length;
}

process.stdout.write(`OG 이미지 생성 — ${artists.length + 1}장 `);
let bytes = await render("home", homeCard());
for (const a of artists) {
  bytes += await render(a.slug, artistCard(a));
  process.stdout.write(".");
}
console.log(`\n→ public/og/ 에 저장 완료 (합계 ${Math.round(bytes / 1024)}KB)\n`);
