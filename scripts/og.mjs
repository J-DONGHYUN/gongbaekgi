/**
 * OG 이미지 생성 — public/og/*.png (1200x630)
 *
 *   npm run og      이미지만 다시 만들기
 *   npm run build   빌드 전에 자동 실행됨
 *
 * 링크를 공유했을 때 보이는 카드다. 카카오톡·X·디스코드가 이걸 읽는다.
 * 한국에서 링크는 대부분 카카오톡으로 돌아다니므로 이 카드가 첫인상이다.
 *
 * 왜 Next 의 opengraph-image 규칙을 안 쓰나:
 *   확장자 없는 파일이 되고 정적 호스팅이 Content-Type 을
 *   application/octet-stream 으로 준다. 그러면 이미지로 인식되지 않는다.
 *   그래서 진짜 .png 로 직접 떨어뜨린다.
 *
 * 디자인은 scripts/carddesign.mjs 에 있다 (promo.mjs 와 공용).
 * 폰트 받기에 실패하면 기존 파일을 그대로 두고 넘어간다. 빌드를 깨뜨리지 않기 위해서다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../lib/slug.js";
import { teamCard, homeCard, loadFont, glyphsFor } from "./carddesign.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/og");
const SIZE = { width: 1200, height: 630 };

const raw = JSON.parse(await readFile(resolve(ROOT, "data/artists.json"), "utf8"));
const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

let fonts;
try {
  const glyphs = glyphsFor(artists);
  const [regular, bold] = await Promise.all([loadFont(400, glyphs), loadFont(700, glyphs)]);
  fonts = [
    { name: "NotoKR", data: regular, weight: 400, style: "normal" },
    { name: "NotoKR", data: bold, weight: 700, style: "normal" },
  ];
} catch (err) {
  console.warn(`\n⚠ 폰트를 받지 못했습니다 (${err.message}).`);
  console.warn("  기존 public/og 이미지를 그대로 두고 넘어갑니다.\n");
  process.exit(0);
}

const { ImageResponse } = await import("next/og.js");
await mkdir(OUT, { recursive: true });

async function render(name, element) {
  const png = Buffer.from(await new ImageResponse(element, { ...SIZE, fonts }).arrayBuffer());
  await writeFile(resolve(OUT, `${name}.png`), png);
  return png.length;
}

await render("home", homeCard(artists.length, true));
let total = 0;
for (const a of artists) total += await render(a.slug, teamCard(a, true));
console.log(`OG ${artists.length + 1}장 · 합계 ${(total / 1024 / 1024).toFixed(1)}MB`);
