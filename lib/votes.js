import { Redis } from "@upstash/redis";

/**
 * 하트 투표 저장소
 *
 * 왜 최근 이틀만 집계하나:
 *   누적으로 쌓으면 순위가 팬덤 크기 순서로 굳고, 한 번 조작한 표가 영구히 남는다.
 *   매일 흘려보내면 조작 이득이 사라지고, 매일 다시 볼 이유가 생긴다.
 *
 * 왜 지수에 공백기를 곱하나:
 *   투표수만 쓰면 결국 팬덤 인원 순위다. BTS·블랙핑크가 늘 1·2위면 볼 이유가 없다.
 *   공백기를 곱하면 팬덤이 작아도 오래 기다린 팀이 올라오고,
 *   이건 공백기 데이터를 가진 우리만 만들 수 있는 순위다.
 */

const COOLDOWN = 60; // 초
const KEEP_DAYS = 3; // 일별 키 보관 기간

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

/** Redis 가 없으면: 로컬 개발은 메모리로, 배포 환경은 기능을 끈다 */
const memory = new Map();
export const available = Boolean(redis) || !process.env.VERCEL;

/** 한국 날짜 기준 키. 자정에 하루가 넘어간다. */
function dayKey(offset = 0) {
  const kst = new Date(Date.now() + 9 * 3_600_000 - offset * 86_400_000);
  return kst.toISOString().slice(0, 10).replace(/-/g, "");
}

const voteKey = (day, slug) => `v:${day}:${slug}`;

/** 기다림 지수 — 1년 기다릴 때마다 표 한 장의 무게가 1 늘어난다 */
export function waitScore(votes, hiatusDays) {
  if (!votes) return 0;
  return Math.round(votes * (1 + Math.max(0, hiatusDays ?? 0) / 365));
}

/**
 * @returns {Promise<Record<string, number>>} slug → 최근 이틀 투표 합계
 */
export async function readVotes(slugs) {
  const days = [dayKey(0), dayKey(1)];
  const keys = days.flatMap((d) => slugs.map((s) => voteKey(d, s)));
  if (keys.length === 0) return {};

  let values;
  if (redis) {
    values = await redis.mget(...keys);
  } else {
    values = keys.map((k) => memory.get(k) ?? 0);
  }

  const out = {};
  for (const s of slugs) out[s] = 0;
  keys.forEach((k, i) => {
    const slug = k.slice(k.indexOf(":", 2) + 1);
    out[slug] = (out[slug] ?? 0) + (Number(values[i]) || 0);
  });
  return out;
}

/**
 * 투표 한 번. 쿨다운은 서버에서 IP 기준으로 본다.
 * 브라우저 기준으로 걸면 개발자도구로 지워버릴 수 있다.
 * @returns {Promise<{ok:boolean, retryAfter?:number}>}
 */
export async function castVote(slug, voterKey) {
  const key = voteKey(dayKey(0), slug);
  // 쿨다운은 팀별로 본다. 전역으로 걸면 여러 팀을 좋아하는 사람이 한 팀만 누를 수 있고,
  // 봇 방어 효과는 어차피 같다(봇은 IP 를 돌린다).
  const cd = `cd:${voterKey}:${slug}`;

  if (redis) {
    // NX 로 먼저 자리를 잡는다. 이미 있으면 쿨다운 중.
    const claimed = await redis.set(cd, 1, { nx: true, ex: COOLDOWN });
    if (!claimed) {
      const ttl = await redis.ttl(cd);
      return { ok: false, retryAfter: ttl > 0 ? ttl : COOLDOWN };
    }
    // 두 명령을 한 번에 보낸다. Upstash 는 HTTP 라 왕복 수가 곧 지연이다.
    const [count] = await redis
      .pipeline()
      .incr(key)
      .expire(key, KEEP_DAYS * 86_400)
      .exec();
    return { ok: true, count };
  }

  const now = Date.now();
  const until = memory.get(cd) ?? 0;
  if (until > now) {
    return { ok: false, retryAfter: Math.ceil((until - now) / 1000) };
  }
  memory.set(cd, now + COOLDOWN * 1000);
  const count = (memory.get(key) ?? 0) + 1;
  memory.set(key, count);
  return { ok: true, count };
}

export { COOLDOWN };
