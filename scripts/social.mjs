/**
 * X(트위터) 계정 이미지 생성 — public/social/*.png
 *
 *   node scripts/social.mjs
 *
 * 프로필 사진 400x400 · 배너 1500x500.
 * og.mjs 와 같은 폰트 경로를 쓴다 (satori 는 woff2 를 못 읽어서 구형 UA 로 ttf 를 받는다).
 *
 * 프로필에 아이돌 사진을 쓰지 않는다 — X 가 타인 사진 사용 시
 * 팬/패러디 표시를 의무화했고, 표시 없이 쓰면 정지 사유다.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL, SITE_NAME } from "../lib/site.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/social");
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

const ACCENT = "#F0914E"; // 사이트에서 "기다리는 중" 에 쓰는 주황
const BG = "#0E0E13";

const LINES = {
  title: SITE_NAME,
  sub: "내 아이돌 마지막 컴백 이후 며칠째",
  foot: "정규·미니 앨범만 · 매일 자동 갱신",
};

const GLYPHS = [
  ...new Set([LINES.title, LINES.sub, LINES.foot, DOMAIN, "D+0123456789·"].join("")),
].join("");

async function loadFont(weight) {
  const api =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}` +
    `&text=${encodeURIComponent(GLYPHS)}`;
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

const box = (style, children) => ({ type: "div", props: { style, children } });
const txt = (style, children) => ({ type: "div", props: { style, children } });

/** 프로필 사진 — 48px 로 줄어들어도 읽혀야 한다. 글자 두 개가 한계다. */
function avatar() {
  return box(
    {
      width: "100%", height: "100%", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: BG, fontFamily: "NotoKR",
    },
    [
      box(
        {
          width: 300, height: 300, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: `16px solid ${ACCENT}`, borderRadius: 999,
        },
        [
          txt(
            {
              fontSize: 150, fontWeight: 700, color: "#F2F2F7",
              letterSpacing: "-0.06em", lineHeight: 1, marginTop: -8,
            },
            "D+"
          ),
        ]
      ),
    ]
  );
}

/**
 * 배너 — 프로필 화면에서 왼쪽 아래는 프로필 사진에 가려지고
 * 모바일에서는 좌우가 잘린다. 그래서 가운데로 모으고 여백을 넉넉히 둔다.
 */
function banner() {
  return box(
    {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: BG, fontFamily: "NotoKR",
      borderBottom: `8px solid ${ACCENT}`,
    },
    [
      txt({ fontSize: 86, fontWeight: 700, color: "#F2F2F7", letterSpacing: "-0.03em" }, LINES.title),
      txt({ fontSize: 38, color: "#98A2B3", marginTop: 18 }, LINES.sub),
      box({ display: "flex", alignItems: "center", marginTop: 30 }, [
        txt({ fontSize: 30, fontWeight: 700, color: ACCENT }, DOMAIN),
      ]),
    ]
  );
}

const { ImageResponse } = await import("next/og.js");

let regular, bold;
try {
  [regular, bold] = await Promise.all([loadFont(400), loadFont(700)]);
} catch (e) {
  console.error("폰트를 받지 못했습니다:", e.message);
  process.exit(1);
}
const fonts = [
  { name: "NotoKR", data: regular, weight: 400, style: "normal" },
  { name: "NotoKR", data: bold, weight: 700, style: "normal" },
];

await mkdir(OUT, { recursive: true });

for (const [name, el, size] of [
  ["avatar", avatar(), { width: 400, height: 400 }],
  ["banner", banner(), { width: 1500, height: 500 }],
]) {
  const png = Buffer.from(await new ImageResponse(el, { ...size, fonts }).arrayBuffer());
  await writeFile(resolve(OUT, `${name}.png`), png);
  console.log(`public/social/${name}.png  ${size.width}x${size.height}  ${(png.length / 1024).toFixed(0)}KB`);
}
