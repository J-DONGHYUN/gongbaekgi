import { artists } from "../../../lib/data";
import { analyze } from "../../../lib/calc";
import { readVotes, waitScore, available } from "../../../lib/votes";

// 10초 캐시. 60초로 두면 투표해도 순위가 안 바뀐 것처럼 보인다.
//   호출은 6배로 늘지만 하루 최대 8,640회라 무료 한도(월 100만) 안에서 여유가 크다.
export const revalidate = 10;

export async function GET() {
  if (!available) {
    return Response.json({ available: false, top: [] }, {
      headers: { "Cache-Control": "public, s-maxage=10" },
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
        artwork: a.comebacks.at(-1)?.artwork ?? null,
        appleUrl: a.comebacks.at(-1)?.url ?? null,
        score: waitScore(votes[a.slug] ?? 0, r.hiatus),
      };
    })
    .filter((a) => a.score > 0)
    .sort((x, y) => y.score - x.score);

  return Response.json(
    { available: true, top: ranked.slice(0, 3), updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" } }
  );
}
