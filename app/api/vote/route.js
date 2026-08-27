import { createHash } from "node:crypto";
import { artists } from "../../../lib/data";
import { castVote, available, COOLDOWN } from "../../../lib/votes";

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

  if (!artists.some((a) => a.slug === slug)) {
    return Response.json({ ok: false, reason: "unknown_artist" }, { status: 404 });
  }

  const result = await castVote(slug, voterKey(request));
  if (!result.ok) {
    return Response.json(
      { ok: false, reason: "cooldown", retryAfter: result.retryAfter ?? COOLDOWN },
      { status: 429 }
    );
  }
  return Response.json({ ok: true, cooldown: COOLDOWN });
}
