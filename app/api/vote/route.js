import { createHash } from "node:crypto";
import { artists } from "../../../lib/data";
import { analyze } from "../../../lib/calc";
import { castVote, readVotes, waitScore, available, COOLDOWN } from "../../../lib/votes";

export const dynamic = "force-dynamic";

/** IP 를 그대로 저장하지 않는다. 쿨다운 판별에만 쓰는 해시. */
function voterKey(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(`gongbaekgi:${ip}`).digest("hex").slice(0, 24);
}

export async function POST(request) {
  if (!available) {
    return Response.json({ ok: false, reason: "unavailable" }, { status: 503 });
  }

  let slug;
  try {
    ({ slug } = await request.json());
  } catch {
    return Response.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const artist = artists.find((a) => a.slug === slug);
  if (!artist) {
    return Response.json({ ok: false, reason: "unknown_artist" }, { status: 404 });
  }

  const result = await castVote(slug, voterKey(request));
  if (!result.ok) {
    return Response.json(
      { ok: false, reason: "cooldown", retryAfter: result.retryAfter ?? COOLDOWN },
      { status: 429 }
    );
  }

  // 홈 순위는 캐시 때문에 몇 초 늦게 바뀐다. 누른 자리에서 바로 결과를 보여주려고
  // 이 팀의 갱신된 지수와 현재 등수를 함께 돌려준다.
  let score = null;
  let rank = null;
  try {
    const votes = await readVotes(artists.map((a) => a.slug));
    const scored = artists
      .map((a) => ({
        slug: a.slug,
        score: waitScore(votes[a.slug] ?? 0, analyze(a.comebacks).hiatus),
      }))
      .filter((a) => a.score > 0)
      .sort((x, y) => y.score - x.score);
    const idx = scored.findIndex((a) => a.slug === slug);
    if (idx !== -1) {
      score = scored[idx].score;
      rank = idx + 1;
    }
  } catch {
    // 지수 계산이 실패해도 투표 자체는 성공이다
  }

  return Response.json({ ok: true, cooldown: COOLDOWN, score, rank });
}
