import { artists } from "../../../lib/data";
import { analyze } from "../../../lib/calc";
import { readVotes, waitScore, available } from "../../../lib/votes";

// 캐시하지 않는다.
//   사용자는 하트를 누르고 곧바로 순위를 확인하려 한다. 몇 초라도 묵은 값을 주면
//   "반영이 안 됐다"고 느낀다. 계산은 Redis 조회 한 번뿐이라 비싸지 않다.
//   비용은 폴링 주기로 조절한다 — 화면에 도착하는 순간은 항상 최신, 열어둔 탭은 느슨하게.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!available) {
    return Response.json({ available: false, top: [] }, {
      headers: { "Cache-Control": "no-store" },
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
    { headers: { "Cache-Control": "no-store" } }
  );
}
