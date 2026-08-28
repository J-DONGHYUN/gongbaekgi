/**
 * 카드 디자인 공용 모듈 — og.mjs 와 promo.mjs 가 같이 쓴다.
 *
 *   wide   1200x630  링크 미리보기용 (카카오톡·X·디스코드가 읽는다)
 *   square 1200x1200 X 에 직접 첨부하는 이미지
 *
 * 한 곳에서 고치면 둘 다 바뀐다. 예전에 og 와 promo 가 따로 있어서
 * 한쪽만 새 디자인이고 다른 쪽은 옛날 디자인으로 남는 일이 있었다.
 *
 * 톤: 조롱이 아니라 기다림. 포토카드처럼 부드럽게.
 */

import { analyze, stateText, humanDuration, fmtDate } from "../lib/calc.js";
import { SITE_URL, SITE_NAME } from "../lib/site.js";

export const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

export const C = {
  ink: "#2B2430",
  mute: "#9089A0",
  rose: "#E9567F",
  roseSoft: "#FDEDF2",
  line: "#F2ECF4",
  card: "#FFFFFF",
  bg: "linear-gradient(150deg, #FFE4EC 0%, #F2E4FF 50%, #E4EFFF 100%)",
};

const teamTint = (hue) => (hue == null ? "#F6F1FA" : `hsl(${hue} 62% 95%)`);
const teamInk = (hue) => (hue == null ? C.mute : `hsl(${hue} 45% 45%)`);

export const box = (style, children) => ({ type: "div", props: { style, children } });
export const txt = (style, children) => ({ type: "div", props: { style, children } });
/** 자식이 없는 div 는 children 을 아예 넘기지 않는다.
 *  빈 배열을 주면 satori 가 자식 수를 잘못 세서 display:flex 를 요구하며 터진다. */
export const leaf = (style) => ({ type: "div", props: { style } });

/** Noto Sans KR 에 ♡ 글리프가 없다. 글자로 쓰면 satori 가 대체 폰트를 받으려다 실패한다. */
const HEART_PATH =
  "M12 21s-6.7-4.35-9.33-8.02C.62 10.2 1.4 6.5 4.2 5.06 6.3 3.98 8.9 4.6 " +
  "10.2 6.4L12 8.9l1.8-2.5c1.3-1.8 3.9-2.42 6-1.34 2.8 1.44 3.58 5.14 " +
  "1.53 7.92C18.7 16.65 12 21 12 21z";

export const heart = (size, color, marginRight = 14) => ({
  type: "svg",
  props: {
    width: size, height: size, viewBox: "0 0 24 24",
    style: { marginRight },
    children: { type: "path", props: { d: HEART_PATH, fill: color } },
  },
});

const pill = (label, bg, fg, fontSize = 30) =>
  box(
    {
      display: "flex", alignItems: "center", alignSelf: "flex-start",
      background: bg, borderRadius: 999, padding: `${fontSize / 2}px ${fontSize}px`,
    },
    [heart(fontSize, fg), txt({ fontSize, fontWeight: 700, color: fg }, label)]
  );

const frame = (wide, children) =>
  box(
    {
      width: "100%", height: "100%", display: "flex",
      padding: wide ? 40 : 64, fontFamily: "NotoKR", backgroundImage: C.bg,
    },
    [
      box(
        {
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          background: C.card, borderRadius: wide ? 40 : 56,
          padding: wide ? "44px 56px" : "70px 72px",
          boxShadow: "0 26px 70px rgba(180,140,175,0.20)",
          justifyContent: "space-between",
        },
        children
      ),
    ]
  );

const footer = (wide, left) =>
  box({ display: "flex", flexDirection: "column" }, [
    leaf({ width: "100%", height: 1, background: C.line }),
    box(
      {
        display: "flex", width: "100%", alignItems: "center",
        justifyContent: "space-between", marginTop: wide ? 18 : 26,
      },
      [
        txt({ fontSize: wide ? 28 : 34, fontWeight: 700, color: C.ink }, left),
        txt({ fontSize: wide ? 25 : 30, color: C.mute }, DOMAIN),
      ]
    ),
  ]);

/** 팀 카드 */
export function teamCard(artist, wide) {
  const a = analyze(artist.comebacks);
  const human = humanDuration(a.hiatus);
  const head = stateText(a, artist.comebacks.length);
  const num = a.hiatus != null ? a.hiatus.toLocaleString("ko-KR") : "—";

  const nameBlock = box({ display: "flex", flexDirection: "column" }, [
    pill("기다리는 중", teamTint(artist.hue), teamInk(artist.hue), wide ? 26 : 30),
    txt(
      {
        fontSize: wide ? 62 : 76, fontWeight: 700, color: C.ink,
        letterSpacing: "-0.03em", marginTop: wide ? 22 : 34, lineHeight: 1.1,
      },
      artist.name
    ),
    artist.nameKo
      ? txt({ fontSize: wide ? 32 : 38, color: C.mute, marginTop: 8 }, artist.nameKo)
      : null,
    // 가로형은 왼쪽 아래가 비어 보인다. 마지막 컴백을 넣어 채우고 근거도 보여준다.
    a.last
      ? box({ display: "flex", flexDirection: "column", marginTop: wide ? 26 : 30 }, [
          txt({ fontSize: wide ? 22 : 26, color: C.mute }, "마지막 컴백"),
          txt(
            { fontSize: wide ? 30 : 34, fontWeight: 700, color: C.ink, marginTop: 4 },
            fmtDate(a.last.date)
          ),
        ])
      : null,
  ]);

  const numberBlock = box(
    { display: "flex", flexDirection: "column", alignItems: wide ? "flex-end" : "center" },
    [
      box({ display: "flex", alignItems: "flex-end" }, [
        txt(
          {
            fontSize: wide ? 190 : 250, fontWeight: 700, color: C.rose,
            lineHeight: 1, letterSpacing: "-0.05em",
          },
          num
        ),
        txt(
          {
            fontSize: wide ? 50 : 62, fontWeight: 700, color: C.rose,
            marginLeft: 14, marginBottom: wide ? 16 : 20,
          },
          "일째"
        ),
      ]),
      human
        ? txt({ fontSize: wide ? 34 : 46, fontWeight: 700, color: C.mute, marginTop: 4 }, human)
        : null,
    ]
  );

  const badge = box(
    {
      display: "flex", alignSelf: wide ? "flex-end" : "center",
      background: C.roseSoft, borderRadius: 999,
      padding: wide ? "12px 28px" : "18px 38px", marginTop: wide ? 14 : 30,
    },
    [txt({ fontSize: wide ? 28 : 36, fontWeight: 700, color: C.rose }, head)]
  );

  if (!wide) {
    return frame(false, [
      nameBlock,
      box({ display: "flex", flexDirection: "column", alignItems: "center" }, [numberBlock, badge]),
      footer(false, SITE_NAME),
    ]);
  }

  // 가로형은 이름과 숫자를 좌우로 나눈다. 630px 에 세로로 쌓으면 답답하다.
  return frame(true, [
    box(
      { display: "flex", width: "100%", alignItems: "flex-start", justifyContent: "space-between" },
      [nameBlock, box({ display: "flex", flexDirection: "column", alignItems: "flex-end" }, [numberBlock, badge])]
    ),
    footer(true, SITE_NAME),
  ]);
}

/**
 * 홈 카드 — 팀 순위를 싣지 않는다.
 * 공백기 긴 순 랭킹은 특정 팀을 조리돌리는 모양이 된다.
 */
export function homeCard(teamCount, wide) {
  const line = (text, gap) =>
    box({ display: "flex", alignItems: "center", marginTop: gap }, [
      heart(wide ? 22 : 28, C.rose, 12),
      txt({ fontSize: wide ? 30 : 38, color: C.ink }, text),
    ]);

  return frame(wide, [
    box({ display: "flex", flexDirection: "column" }, [
      pill("기다리는 중", C.roseSoft, C.rose, wide ? 26 : 30),
      txt(
        {
          fontSize: wide ? 68 : 88, fontWeight: 700, color: C.ink,
          marginTop: wide ? 20 : 34, letterSpacing: "-0.035em",
        },
        SITE_NAME
      ),
    ]),
    box({ display: "flex", flexDirection: "column" }, [
      txt(
        { fontSize: wide ? 40 : 52, fontWeight: 700, color: C.ink, lineHeight: 1.35, letterSpacing: "-0.02em" },
        "내 아이돌 마지막 컴백 이후"
      ),
      txt(
        { fontSize: wide ? 40 : 52, fontWeight: 700, color: C.rose, lineHeight: 1.35, letterSpacing: "-0.02em" },
        "며칠째인지 세어드립니다"
      ),
      box({ display: "flex", flexDirection: wide ? "row" : "column", marginTop: wide ? 16 : 34 }, [
        line("정규·미니 앨범만", wide ? 0 : 24),
        wide ? box({ display: "flex", width: 28 }) : null,
        line("평균 주기와 비교", wide ? 0 : 24),
        wide ? box({ display: "flex", width: 28 }) : null,
        line("매일 자동 갱신", wide ? 0 : 24),
      ]),
    ]),
    footer(wide, `아이돌 ${teamCount}팀`),
  ]);
}

/** 폰트를 부분집합으로 받는다. satori 는 woff2 를 못 읽어서 구형 UA 로 ttf 를 받는다. */
export async function loadFont(weight, glyphs) {
  const api =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}` +
    `&text=${encodeURIComponent(glyphs)}`;
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

/** 카드에 실제로 쓰이는 글자만 모은다 */
export function glyphsFor(artists) {
  const s = [
    "기다리는 중", "일째", SITE_NAME, DOMAIN, "0123456789,.·-", "년월일 ",
    "내 아이돌 마지막 컴백 이후 며칠째인지 세어드립니다",
    "정규·미니 앨범만", "평균 주기와 비교", "매일 자동 갱신", "아이돌 팀",
  ];
  for (const a of artists) {
    const r = analyze(a.comebacks);
    s.push(a.name, a.nameKo ?? "", stateText(r, a.comebacks.length), humanDuration(r.hiatus) ?? "");
  }
  return [...new Set(s.join(""))].join("");
}
