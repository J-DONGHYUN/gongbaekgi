/**
 * 공백기 며칠째 — 발매 이력 수집 스크립트 (iTunes Search API, 키 불필요)
 *
 *   npm run fetch:test    아티스트 3팀만 (검증용, 파일 저장 안 함)
 *   npm run fetch         전체 수집 → data/artists.json 저장
 *
 * Spotify 는 2026년부터 앱 소유자에게 Premium 구독을 요구해 403 이 나므로 사용하지 않는다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dominantHue, resizeArtwork } from "./artwork.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── 컴백 판정 규칙 (PLAN.md 와 반드시 일치시킬 것) ────────────────────────
const MIN_TRACKS = 4; // 미니 4~7곡 / 정규 9곡+ / 싱글앨범 1~3곡
const EXCLUDE_WORDS = [
  // 싱글류 — EP 로 태그돼 있어도 컴백이 아니다
  "- single", "digital single", "special single",
  // 리믹스·변형판
  "remix", "instrumental", "inst.", "sped up", "slowed down",
  "karaoke", "scream",          // K-POP ScreaM = SM 리믹스 컴필레이션
  "the best", "best of", "greatest hits",   // 베스트 컴필레이션
  // 라이브·사운드트랙
  "live", "ost", "soundtrack", "original television", "original tv",
  // 해외 발매판 — 한국 컴백이 아니다
  "japanese", "japan edition", "japan ver", "chinese", "mandarin",
  "tokyo",                       // 일본 데뷔·현지 발매반 (KISS OF LIFE TOKYO MISSION START 등)
  "english ver", "korean ver",
];
// "- EP" 는 미니 앨범이므로 제외하지 않는다.
// "Repackage" 도 활동을 다시 하므로 컴백으로 유지한다.

const MERGE_WINDOW = 30; // 이 일수 안의 연속 발매는 한 번의 활동으로 합친다
const DELAY = 1000; // iTunes 요청 제한 대비

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
const DRY_RUN = LIMIT !== Infinity; // 테스트 모드에서는 파일을 쓰지 않는다

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 1. 앨범 조회 ─────────────────────────────────────────────────────────
// lookup 의 results[0] 은 아티스트 정보이고, 그 뒤가 앨범 목록이다.
async function fetchAlbums(itunesId) {
  const url = "https://itunes.apple.com/lookup"
    + `?id=${itunesId}&entity=album&limit=200&country=KR&sort=recent`;
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) {
    console.log("    · 요청 제한, 5초 대기");
    await sleep(5000);
    return fetchAlbums(itunesId);
  }
  if (!res.ok) throw new Error(`앨범 조회 실패 HTTP ${res.status}`);
  const json = await res.json();
  return (json.results ?? []).filter((r) => r.wrapperType === "collection");
}

// ── 2. 중복 제거용 키 ────────────────────────────────────────────────────
// 멤버별 Special Version, 지역판, 리이슈를 하나로 묶기 위해 이름을 뭉갠다.
function normalizeKey(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")   // (WINTER Special Version) 등 제거
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[-–—:|.,'"`~!@#$%^&*_+=/\\]/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\b(ep|lp|album|single|mini|vol|deluxe|edition|ver|version|special)\b/g, " ")
    .replace(/\b(1st|2nd|3rd|\d+th)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── 3. 컴백 판정 ─────────────────────────────────────────────────────────
function isComeback(album) {
  const name = (album.collectionName ?? "").toLowerCase();
  if (EXCLUDE_WORDS.some((w) => name.includes(w))) return false;
  if ((album.trackCount ?? 0) < MIN_TRACKS) return false;
  // 예약 발매(미래 날짜)는 제외한다. 넣으면 공백기가 음수가 된다.
  if (toDay(album.releaseDate) > TODAY) return false;
  return true;
}

const toDay = (iso) => (iso ?? "").slice(0, 10);
const TODAY = new Date().toISOString().slice(0, 10); // 2026-05-28T07:00:00Z → 2026-05-28

// ── 4. 정리: 이름 중복 → 날짜 중복 → 정렬 ────────────────────────────────
function buildComebacks(albums) {
  const stats = { raw: albums.length };

  const kept = albums.filter(isComeback);
  stats.afterFilter = kept.length;

  // 이름이 같으면 가장 이른 발매일만 남긴다
  const byName = new Map();
  for (const a of kept) {
    const key = normalizeKey(a.collectionName);
    const date = toDay(a.releaseDate);
    if (!date) continue;
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, {
        name: a.collectionName, date,
        tracks: a.trackCount,
        url: a.collectionViewUrl ?? "",              // Apple Music 앨범 페이지
        artwork: resizeArtwork(a.artworkUrl100, "300x300bb") ?? "",
      });
      continue;
    }
    // 날짜는 가장 이른 것을 쓴다 (재발매판이 아니라 원 발매일)
    if (date < prev.date) {
      prev.date = date;
      prev.tracks = a.trackCount;
      prev.url = a.collectionViewUrl ?? "";
      prev.artwork = resizeArtwork(a.artworkUrl100, "300x300bb") ?? "";
    }
    // 이름은 가장 짧은 것을 쓴다 — "(NINGNING Special Version)" 대신 본판 이름
    if (a.collectionName.length < prev.name.length) prev.name = a.collectionName;
  }
  stats.afterNameDedupe = byName.size;

  // 같은 날 여러 장은 1회로 합산
  const byDate = new Map();
  for (const c of byName.values()) if (!byDate.has(c.date)) byDate.set(c.date, c);
  stats.afterDateDedupe = byDate.size;

  const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  // 30일 안에 나온 두 발매는 같은 활동 주기로 본다.
  //   싱글에 리믹스를 붙여 EP 로 낸 것, 베스트반, 버전 분리 발매가 이 구간에 몰린다.
  //   진짜 리패키지는 보통 한 달 이상 뒤에 나오므로 살아남는다.
  const list = [];
  for (const c of sorted) {
    const prev = list.at(-1);
    if (prev && (new Date(c.date) - new Date(prev.date)) / 86400000 < MERGE_WINDOW) continue;
    list.push(c);
  }
  stats.afterMerge = list.length;

  return { list, stats };
}

// ── 5. 중복 제거 실패 신호 ───────────────────────────────────────────────
// 컴백 간격이 30일 미만이면 같은 앨범을 두 번 셌을 가능성이 높다.
function suspiciousGaps(list) {
  const flags = [];
  for (let i = 1; i < list.length; i++) {
    const gap = Math.round((new Date(list[i].date) - new Date(list[i - 1].date)) / 86400000);
    if (gap < 30) {
      flags.push(`${list[i - 1].date} "${list[i - 1].name}" → ${list[i].date} "${list[i].name}" (${gap}일)`);
    }
  }
  return flags;
}

// ── 실행 ─────────────────────────────────────────────────────────────────
const config = JSON.parse(await readFile(resolve(ROOT, "scripts/artists.config.json"), "utf8"));
const targets = config.artists.filter((a) => a.itunesId).slice(0, LIMIT);
const missing = config.artists.filter((a) => !a.itunesId).length;

if (targets.length === 0) {
  console.error("\n✗ artists.config.json 에 itunesId 가 채워진 아티스트가 없습니다.");
  console.error("  먼저 실행하세요:  npm run ids:apply\n");
  process.exit(1);
}

console.log(`\n대상 ${targets.length}팀${DRY_RUN ? " (테스트 모드 — 파일 저장 안 함)" : ""}`);
if (missing) console.log(`ID 미입력으로 건너뛴 팀: ${missing}`);
console.log("");

const results = [];
let totalFlags = 0;

for (const artist of targets) {
  process.stdout.write(`▸ ${artist.name}`);
  try {
    const albums = await fetchAlbums(artist.itunesId);
    const { list, stats } = buildComebacks(albums);
    const flags = suspiciousGaps(list);
    totalFlags += flags.length;

    console.log(
      `  받음 ${stats.raw} → 판정통과 ${stats.afterFilter}`
      + ` → 이름중복제거 ${stats.afterNameDedupe} → 날짜합산 ${stats.afterDateDedupe}`
      + ` → 30일병합 ${stats.afterMerge}`
    );

    if (list.length) {
      const last = list[list.length - 1];
      const days = Math.floor((Date.now() - new Date(last.date)) / 86400000);
      console.log(`    최근 컴백 ${last.date} "${last.name}" · 공백기 ${days}일`);
    }
    if (list.length < 3) console.log(`    ⚠ 컴백 ${list.length}회 — 데이터 부족`);
    for (const f of flags) console.log(`    ⚠ 간격 의심: ${f}`);

    if (DRY_RUN) {
      console.log("    전체 목록:");
      for (const c of list) {
        console.log(`      ${c.date}  ${String(c.tracks).padStart(2)}곡  ${c.name}`);
      }
    }

    // 팀 색상 — 마지막 컴백 앨범 커버의 대표 hue. 컴백하면 자동으로 바뀐다.
    const hue = await dominantHue(list.at(-1)?.artwork);
    if (hue != null) console.log(`    색상 hue ${hue}`);

    results.push({
      id: artist.itunesId,
      name: artist.name,
      nameKo: artist.nameKo,
      hue,
      comebacks: list,
    });
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
  }
  await sleep(DELAY);
}

console.log(`\n완료 — 성공 ${results.length} / ${targets.length}팀`);
if (totalFlags) {
  console.log(`⚠ 간격 의심 항목 ${totalFlags}건 — 중복 제거 규칙을 손봐야 할 수 있습니다.`);
}

if (DRY_RUN) {
  console.log("\n테스트 모드라 파일을 저장하지 않았습니다.");
  console.log("위 컴백 목록을 나무위키 컴백 이력과 한 줄씩 대조하세요. ← Day 1 판정 게이트\n");
} else {
  await mkdir(resolve(ROOT, "data"), { recursive: true });
  const out = { fetchedAt: new Date().toISOString(), source: "itunes", artists: results };
  await writeFile(resolve(ROOT, "data/artists.json"), JSON.stringify(out, null, 2), "utf8");
  console.log("→ data/artists.json 저장 완료\n");
}
