import { artists } from "../../../lib/data";
import { analyze } from "../../../lib/calc";
import { readVotes, waitScore, available } from "../../../lib/votes";

// 60초 캐시 — 요구사항이 1분 갱신이고, 함수 호출도 그만큼 줄어든다
export const revalidate = 60;

export async function GET() {
  if (!available) {
    return Response.json({ available: false, top: [] }, {
      headers: { "Cache-Control": "public, s-maxage=60" },
    });
  }

  const slugs = artists.map((a) => a.slug);
  const votes = await readVotes(slugs);

  const ranked = artists
    .map((a) => {
      const r = analyze(a.comebacks);
      return {
        slug: a.slug,
        name: a.name,
        nameKo: a.nameKo,
        hue: a.hue,
        hiatus: r.hiatus,
        score: waitScore(votes[a.slug] ?? 0, r.hiatus),
      };
    })
    .filter((a) => a.score > 0)
    .sort((x, y) => y.score - x.score);

  return Response.json(
    { available: true, top: ranked.slice(0, 3), updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
