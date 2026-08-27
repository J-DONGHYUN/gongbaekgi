/**
 * 아티스트 ID 찾기 — iTunes Search API (키 불필요)
 *
 *   npm run ids          찾기만 하고 결과를 보여준다 (파일 안 건드림)
 *   npm run ids:apply    확실한 것만 config 에 기록, 애매한 건 비워둔다
 *
 * 왜 이렇게 하는가:
 *   iTunes 의 "아티스트 검색"은 K-pop 에 부정확하다. BTS 를 치면 멤버들만 나오고
 *   그룹은 안 나온다. 그래서 대신 "앨범 검색"으로 팀 이름과 일치하는 앨범들을 모아
 *   그 앨범의 주인(artistId)을 역추적한다. 앨범 제목은 고유해서 훨씬 정확하다.
 *
 *   또 한국 스토어에는 팀이 한글 이름으로 등록된 경우가 많다 (BTS → 방탄소년단).
 *   그래서 영문·한글 두 가지로 검색하고 양쪽 이름을 모두 일치 대상으로 본다.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = resolve(ROOT, "scripts/artists.config.json");
const APPLY = process.argv.includes("--apply");

const DELAY = 1100;      // iTunes 요청 제한 대비
const MIN_MATCHES = 3;   // 이름이 일치하는 앨범이 최소 3장은 나와야 신뢰
const MIN_CATALOG = 5;   // 그 아티스트의 전체 앨범이 최소 5장은 되어야 신뢰
// 이름이 똑같은 외국 아티스트를 걸러내기 위한 장르 블록리스트 (예: LISA vs 일본 LiSA)
const BAD_GENRES = ["일본", "j-pop", "만화", "anime", "이스라엘", "크리스천", "비디오 게임", "클래식"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 대소문자·공백·기호·악센트는 무시하되 한글은 살린다.
//   NFD 로 분해하면 한글도 자모로 쪼개져 가-힣 범위를 벗어난다.
//   그래서 라틴 악센트(U+0300~U+036F)만 지우고 NFC 로 다시 합친 뒤 필터링한다.
const norm = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "");

async function get(url) {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url);
    if (res.status === 403 || res.status === 429) {
      process.stdout.write(" (제한, 대기)");
      await sleep(5000);
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
}

/** 앨범 검색으로 artistId 후보를 모은다 */
async function resolveArtist(artist) {
  const want = new Set([norm(artist.name), norm(artist.nameKo)].filter(Boolean));
  const tally = new Map();

  for (const term of [artist.name, artist.nameKo].filter(Boolean)) {
    const json = await get(
      "https://itunes.apple.com/search"
      + `?term=${encodeURIComponent(term)}&entity=album&attribute=artistTerm`
      + `&country=KR&limit=50`
    );
    for (const a of json?.results ?? []) {
      if (!want.has(norm(a.artistName))) continue;
      const e = tally.get(a.artistId) ?? { hits: 0, name: a.artistName };
      e.hits++;
      tally.set(a.artistId, e);
    }
    await sleep(DELAY);
  }

  const ranked = [...tally.entries()].sort((a, b) => b[1].hits - a[1].hits);
  if (ranked.length === 0) return null;

  const [id, info] = ranked[0];

  // 전체 카탈로그 크기로 한 번 더 확인한다
  const look = await get(
    `https://itunes.apple.com/lookup?id=${id}&entity=album&limit=200&country=KR`
  );
  const albums = (look?.results ?? []).filter((x) => x.wrapperType === "collection");
  const canon = (look?.results ?? []).find((x) => x.wrapperType === "artist");
  await sleep(DELAY);

  // 앨범에 적힌 이름이 아니라 아티스트 페이지의 정식 이름으로 확인한다
  const nameOk = canon ? want.has(norm(canon.artistName)) : false;
  const genre = canon?.primaryGenreName ?? "";
  const genreOk = !BAD_GENRES.some((g) => genre.toLowerCase().includes(g));

  const latest = [...albums]
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))[0];

  return {
    id,
    storeName: canon?.artistName ?? info.name,
    genre,
    hits: info.hits,
    catalog: albums.length,
    latest: latest
      ? `${(latest.releaseDate ?? "").slice(0, 10)} ${latest.collectionName}`
      : "(앨범 없음)",
    confident: nameOk && genreOk && info.hits >= MIN_MATCHES && albums.length >= MIN_CATALOG,
  };
}

// ── 실행 ──────────────────────────────────────────────────────────────────
const config = JSON.parse(await readFile(CONFIG, "utf8"));
const list = config.artists;

console.log(`\n${list.length}팀 확인${APPLY ? " (확실한 것은 기록)" : " (미리보기 — 파일 안 건드림)"}`);
console.log(`약 ${Math.ceil((list.length * DELAY * 3) / 1000)}초 걸립니다.\n`);

let ok = 0, changed = 0;
const manual = [];

for (const artist of list) {
  process.stdout.write(`▸ ${artist.name.padEnd(20)}`);
  let r = null;
  try {
    r = await resolveArtist(artist);
  } catch (err) {
    console.log(` ✗ ${err.message}`);
    manual.push(artist.name);
    continue;
  }

  if (!r) {
    console.log(` ✗ 이름이 일치하는 앨범 없음`);
    manual.push(artist.name);
    continue;
  }

  const diff = artist.itunesId && String(artist.itunesId) !== String(r.id);

  if (r.confident) {
    ok++;
    if (diff) changed++;
    console.log(
      ` ✓ ${String(r.id).padEnd(11)} ${r.storeName.padEnd(14)} [${r.genre}]`
      + ` 앨범 ${String(r.catalog).padStart(3)}장${diff ? "  ← 기존 ID 와 다름" : ""}`
    );
    console.log(`    최신: ${r.latest}`);
    if (APPLY) artist.itunesId = r.id;
  } else {
    manual.push(artist.name);
    console.log(
      ` ⚠ 확인 필요 — ${String(r.id)} ${r.storeName} [${r.genre}]`
      + ` (일치 ${r.hits}장 / 전체 ${r.catalog}장)`
    );
    console.log(`    최신: ${r.latest}`);
    console.log(`    https://music.apple.com/kr/artist/${r.id}`);
  }
}

console.log(`\n${"─".repeat(64)}`);
if (APPLY) {
  await writeFile(CONFIG, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`확정 ${ok}팀 기록 완료${changed ? ` (그중 ${changed}팀은 기존 ID 를 교체)` : ""}`);
} else {
  console.log(`확정 가능 ${ok}팀${changed ? ` (그중 ${changed}팀은 기존 ID 와 다름)` : ""}`);
  console.log(`실제로 기록하려면:  npm run ids:apply`);
}

if (manual.length) {
  console.log(`\n손으로 확인할 ${manual.length}팀:`);
  console.log("  " + manual.join(", "));
  console.log("\n위에 뜬 Apple Music 링크를 열어 맞는 팀인지 보고,");
  console.log("scripts/artists.config.json 의 itunesId 에 직접 넣으세요.");
  console.log("애매하면 비워두세요 — 빈 칸은 수집에서 건너뜁니다.");
}
console.log("");
