/**
 * 홍보용 카드 생성 — public/promo/*.png (1200x1200 정사각)
 *
 *   npm run promo            전체
 *   npm run promo seventeen  일부만
 *
 * X 에 직접 첨부하는 이미지. 정사각이라 피드에서 크게 보이고
 * 팬이 캡처해서 다시 올리기 좋다. 디자인은 scripts/carddesign.mjs 에 있다.
 *
 * 생성물은 커밋하지 않는다 (.gitignore). 숫자가 매일 바뀌므로 올리기 직전에 만든다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../lib/slug.js";
import { teamCard, homeCard, loadFont, glyphsFor } from "./carddesign.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/promo");
const SIZE = { width: 1200, height: 1200 };

const raw = JSON.parse(await readFile(resolve(ROOT, "data/artists.json"), "utf8"));
const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const glyphs = glyphsFor(artists);
let regular, bold;
try {
  [regular, bold] = await Promise.all([loadFont(400, glyphs), loadFont(700, glyphs)]);
} catch (e) {
  console.error("폰트를 받지 못했습니다:", e.message);
  process.exit(1);
}
const fonts = [
  { name: "NotoKR", data: regular, weight: 400, style: "normal" },
  { name: "NotoKR", data: bold, weight: 700, style: "normal" },
];

const { ImageResponse } = await import("next/og.js");
await mkdir(OUT, { recursive: true });

const render = async (name, el) => {
  const png = Buffer.from(await new ImageResponse(el, { ...SIZE, fonts }).arrayBuffer());
  await writeFile(resolve(OUT, `${name}.png`), png);
  return png.length;
};

const only = process.argv.slice(2);
if (only.length) {
  for (const slug of only) {
    if (slug === "home") {
      await render("home", homeCard(artists.length, false));
      console.log("home");
      continue;
    }
    const a = artists.find((x) => x.slug === slug);
    if (!a) { console.error(`없는 팀: ${slug}`); continue; }
    console.log(slug, ((await render(slug, teamCard(a, false))) / 1024).toFixed(0) + "KB");
  }
} else {
  await render("home", homeCard(artists.length, false));
  let total = 0;
  for (const a of artists) total += await render(a.slug, teamCard(a, false));
  console.log(`${artists.length + 1}장 생성 · 합계 ${(total / 1024 / 1024).toFixed(1)}MB`);
}
