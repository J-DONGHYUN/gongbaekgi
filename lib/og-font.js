import { artists } from "./data";
import { SITE_URL, SITE_NAME } from "./site";

/**
 * OG 이미지에 실제로 쓰일 글자만 모아 폰트를 부분집합으로 받는다.
 * 한글 전체 폰트는 수 MB 지만 이렇게 하면 수십 KB 로 끝난다.
 */
const GLYPHS = [
  ...new Set(
    [
      "일째 평균보다 더 기다리는 중 활동 주기 안 슬슬 나올 때",
      "데이터 부족 컴백 기록 없음 회 공백기 며칠째",
      "우리 애 쉬고 있나 지금 가장 오래 팀",
      SITE_NAME,
      SITE_URL.replace(/^https?:\/\//, ""),
      "0123456789,.·—-",
      ...artists.map((a) => `${a.name}${a.nameKo ?? ""}`),
    ].join("")
  ),
].join("");

const cache = new Map();

/** 빌드 한 번에 44장을 만드는 동안 폰트를 재사용한다 */
export function loadFont(weight) {
  if (!cache.has(weight)) {
    cache.set(
      weight,
      (async () => {
        const api =
          "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@" +
          weight + "&text=" + encodeURIComponent(GLYPHS);
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
      })()
    );
  }
  return cache.get(weight);
}
