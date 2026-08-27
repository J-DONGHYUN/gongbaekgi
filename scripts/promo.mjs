/**
 * 홍보용 카드 생성 — public/promo/*.png (1200x1200 정사각)
 *
 *   npm run promo
 *
 * og/ 와 용도가 다르다.
 *   og/    링크 미리보기용 1200x630. 어두운 톤. 메타태그가 읽는다.
 *   promo/ X 에 직접 첨부하는 이미지. 정사각이라 피드에서 크게 보이고
 *          팬이 캡처해서 다시 올리기 좋다.
 *
 * 톤: 조롱이 아니라 기다림. 포토카드처럼 부드럽게.
 * K-pop 팬덤 시각 언어에 맞춘다 — 파스텔 그라데이션, 둥근 카드, 로즈 숫자.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyze, stateText, humanDuration } from "../lib/calc.js";
import { slugify } from "../lib/slug.js";
import { SITE_URL, SITE_NAME } from "../lib/site.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/promo");
const SIZE = { width: 1200, height: 1200 };
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

const C = {
  ink: "#2B2430",       // 본문
  mute: "#9089A0",      // 보조
  rose: "#E9567F",      // 숫자·강조
  roseSoft: "#FDEDF2",  // 배지 배경
  line: "#F2ECF4",      // 구분선
  card: "#FFFFFF",
};

const raw = JSON.parse(await readFile(resolve(ROOT, "data/artists.json"), "utf8"));
const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** 팀 색상을 아주 연하게만 쓴다. 파스텔 팔레트를 깨지 않도록. */
const teamTint = (hue) => (hue == null ? "#F6F1FA" : `hsl(${hue} 62% 95%)`);
const teamInk = (hue) => (hue == null ? C.mute : `hsl(${hue} 45% 45%)`);

// ── 렌더할 문자열을 모아 폰트 부분집합을 만든다 ─────────────────────────
const STRINGS = ["기다리는 중", "일째", SITE_NAME, DOMAIN, "0123456789,.·-", "내 아이돌 마지막 컴백 이후 며칠째인지 세어드립니다",
  "정규·미니 앨범만 카운트", "평균 컴백 주기와 비교", "매일 자동으로 갱신", "아이돌 팀"];
for (const a of artists) {
  const r = analyze(a.comebacks);
  STRINGS.push(a.name, a.nameKo ?? "", stateText(r, a.comebacks.length), humanDuration(r.hiatus) ?? "");
}
const GLYPHS = [...new Set(STRINGS.join(""))].join("");

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

/** 바깥 배경 + 흰 카드. 모든 카드가 같은 액자를 쓴다. */
const frame = (children) =>
  box(
    {
      width: "100%", height: "100%", display: "flex", padding: 64,
      fontFamily: "NotoKR",
      backgroundImage:
        "linear-gradient(150deg, #FFE4EC 0%, #F2E4FF 50%, #E4EFFF 100%)",
    },
    [
      box(
        {
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: C.card, borderRadius: 56, padding: "70px 72px",
          boxShadow: "0 26px 70px rgba(180,140,175,0.20)",
          justifyContent: "space-between",
        },
        children
      ),
    ]
  );

/**
 * 하트 — Noto Sans KR 에 ♡ 글리프가 없어서 글자로 쓰면 두부(□)가 되고,
 * satori 가 대체 폰트를 받아오려다 400 을 맞고 렌더가 깨진다. 그래서 SVG 로 그린다.
 * div 두 장을 회전시키는 방법도 되지만 모양이 어설프게 나온다.
 */
const HEART_PATH =
  "M12 21s-6.7-4.35-9.33-8.02C.62 10.2 1.4 6.5 4.2 5.06 6.3 3.98 8.9 4.6 " +
  "10.2 6.4L12 8.9l1.8-2.5c1.3-1.8 3.9-2.42 6-1.34 2.8 1.44 3.58 5.14 " +
  "1.53 7.92C18.7 16.65 12 21 12 21z";

const heart = (size, color) => ({
  type: "svg",
  props: {
    width: size, height: size, viewBox: "0 0 24 24",
    style: { marginRight: 14 },
    children: { type: "path", props: { d: HEART_PATH, fill: color } },
  },
});

/** 하트 + 라벨 알약 */
const pill = (label, bg, fg) =>
  box(
    {
      display: "flex", alignItems: "center", alignSelf: "flex-start",
      background: bg, borderRadius: 999, padding: "16px 32px",
    },
    [heart(30, fg), txt({ fontSize: 30, fontWeight: 700, color: fg }, label)]
  );

function teamCard(artist) {
  const a = analyze(artist.comebacks);
  const human = humanDuration(a.hiatus);
  const head = stateText(a, artist.comebacks.length);
  const tint = teamTint(artist.hue);
  const tinkInk = teamInk(artist.hue);

  return frame([
    // 상단 — 기다림 라벨 + 팀 이름
    box({ display: "flex", flexDirection: "column" }, [
      pill("기다리는 중", tint, tinkInk),
      txt(
        {
          fontSize: 76, fontWeight: 700, color: C.ink,
          letterSpacing: "-0.03em", marginTop: 34, lineHeight: 1.1,
        },
        artist.name
      ),
      artist.nameKo
        ? txt({ fontSize: 38, color: C.mute, marginTop: 10 }, artist.nameKo)
        : null,
    ]),

    // 가운데 — 숫자가 주인공
    box({ display: "flex", flexDirection: "column", alignItems: "center" }, [
      box({ display: "flex", alignItems: "flex-end" }, [
        txt(
          {
            fontSize: 300, fontWeight: 700, color: C.rose,
            lineHeight: 1, letterSpacing: "-0.05em",
          },
          a.hiatus != null ? a.hiatus.toLocaleString("ko-KR") : "—"
        ),
        txt(
          { fontSize: 72, fontWeight: 700, color: C.rose, marginLeft: 16, marginBottom: 26 },
          "일째"
        ),
      ]),
      human ? txt({ fontSize: 46, fontWeight: 700, color: C.mute, marginTop: 6 }, human) : null,
      box(
        {
          display: "flex", background: C.roseSoft, borderRadius: 999,
          padding: "18px 38px", marginTop: 30,
        },
        [txt({ fontSize: 36, fontWeight: 700, color: C.rose }, head)]
      ),
    ]),

    // 하단 — 출처
    box({ display: "flex", flexDirection: "column" }, [
      box({ display: "flex", width: "100%", height: 1, background: C.line }),
      box(
        {
          display: "flex", width: "100%", alignItems: "center",
          justifyContent: "space-between", marginTop: 26,
        },
        [
          txt({ fontSize: 34, fontWeight: 700, color: C.ink }, SITE_NAME),
          txt({ fontSize: 30, color: C.mute }, DOMAIN),
        ]
      ),
    ]),
  ]);
}

/**
 * 홈 카드는 팀 순위를 싣지 않는다.
 * 공백기 긴 순 랭킹은 특정 팀을 조리돌리는 모양이 된다 (CLAUDE.md 규칙).
 * 대신 이게 무슨 서비스인지만 말한다. 팀별 카드는 팬이 자기 팀 걸 고르는 것이라 성격이 다르다.
 */
function homeCard() {
  const line = (text) =>
    box({ display: "flex", alignItems: "center", marginTop: 24 }, [
      heart(28, C.rose),
      txt({ fontSize: 38, color: C.ink }, text),
    ]);

  return frame([
    box({ display: "flex", flexDirection: "column" }, [
      pill("기다리는 중", C.roseSoft, C.rose),
      txt(
        { fontSize: 88, fontWeight: 700, color: C.ink, marginTop: 34, letterSpacing: "-0.035em" },
        SITE_NAME
      ),
    ]),

    box({ display: "flex", flexDirection: "column" }, [
      txt(
        { fontSize: 52, fontWeight: 700, color: C.ink, lineHeight: 1.4, letterSpacing: "-0.02em" },
        "내 아이돌 마지막 컴백 이후"
      ),
      txt(
        { fontSize: 52, fontWeight: 700, color: C.rose, lineHeight: 1.4, letterSpacing: "-0.02em" },
        "며칠째인지 세어드립니다"
      ),
      box({ display: "flex", flexDirection: "column", marginTop: 34 }, [
        line("정규·미니 앨범만 카운트"),
        line("평균 컴백 주기와 비교"),
        line("매일 자동으로 갱신"),
      ]),
    ]),

    box({ display: "flex", flexDirection: "column" }, [
      box({ display: "flex", width: "100%", height: 1, background: C.line }),
      box(
        { display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", marginTop: 26 },
        [
          txt({ fontSize: 34, fontWeight: 700, color: C.ink }, `아이돌 ${artists.length}팀`),
          txt({ fontSize: 30, color: C.mute }, DOMAIN),
        ]
      ),
    ]),
  ]);
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

const only = process.argv.slice(2);
const render = async (name, el) => {
  const png = Buffer.from(await new ImageResponse(el, { ...SIZE, fonts }).arrayBuffer());
  await writeFile(resolve(OUT, `${name}.png`), png);
  return png.length;
};

if (only.length) {
  for (const slug of only) {
    if (slug === "home") { await render("home", homeCard()); console.log("home"); continue; }
    const a = artists.find((x) => x.slug === slug);
    if (!a) { console.error(`없는 팀: ${slug}`); continue; }
    console.log(slug, (await render(slug, teamCard(a)) / 1024).toFixed(0) + "KB");
  }
} else {
  await render("home", homeCard());
  let total = 0;
  for (const a of artists) total += await render(a.slug, teamCard(a));
  console.log(`${artists.length + 1}장 생성 · 합계 ${(total / 1024 / 1024).toFixed(1)}MB`);
}
