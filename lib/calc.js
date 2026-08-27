/**
 * 공백기 계산 (PLAN.md 의 계산 로직과 반드시 일치시킬 것)
 *
 *   기준주기 = 최근 5회 간격의 중앙값   ← 평균이 아니다.
 *              군백기나 활동 중단 같은 이상치 하나가 평균을 통째로 망가뜨린다.
 *   공백기   = 오늘 - 마지막 컴백일      ← 브라우저에서 오늘 날짜로 계산한다.
 */

const DAY = 86_400_000;

export const daysBetween = (from, to) =>
  Math.floor((new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0)) / DAY);

function median(nums) {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/** 인접한 컴백 사이의 간격(일) 목록 */
export function gaps(comebacks) {
  const out = [];
  for (let i = 1; i < comebacks.length; i++) {
    out.push(daysBetween(comebacks[i - 1].date, comebacks[i].date));
  }
  return out;
}

/**
 * @param {Array<{date:string,name:string}>} comebacks 날짜 오름차순
 * @param {Date} now 기준 시각 (서버 빌드 때와 브라우저에서 각각 다르게 들어온다)
 */
export function analyze(comebacks, now = new Date()) {
  const last = comebacks.at(-1) ?? null;
  if (!last) {
    return { enough: false, last: null, hiatus: null, cycle: null, gapList: [] };
  }

  const hiatus = daysBetween(last.date, now);
  const gapList = gaps(comebacks);
  const recent = gapList.slice(-5);
  const cycle = median(recent);

  // 컴백이 3회 미만이면 주기를 말할 수 없다
  const enough = comebacks.length >= 3 && cycle != null;

  if (!enough) {
    return { enough: false, last, hiatus, cycle, gapList, recent };
  }

  const ratio = hiatus / cycle;
  const state =
    ratio < 0.7 ? "inCycle" : ratio < 1.0 ? "soon" : "overdue";

  // 예측은 점이 아니라 범위로.
  //   최근 3회의 최소~최대를 그대로 쓰면 1년 반짜리 구간이 나와 쓸모가 없다.
  //   기준주기를 중심으로 ±30%(최소 ±20일) 창을 잡는다.
  const last3 = gapList.slice(-3);
  const lastMs = new Date(last.date).getTime();
  const pad = Math.max(20, Math.round(cycle * 0.3));
  const forecast = {
    from: new Date(lastMs + (cycle - pad) * DAY),
    to: new Date(lastMs + (cycle + pad) * DAY),
  };

  return {
    enough: true,
    last,
    hiatus,
    cycle,
    ratio,
    state,
    over: hiatus - cycle,
    gapList,
    recent,
    forecast,
    // 간격 편차가 크면 예측을 믿기 어렵다
    // 간격 편차가 기준주기의 1.5배를 넘을 때만 "낮음"으로 본다.
    // K-pop 컴백 간격은 원래 들쭉날쭉해서 기준이 빡빡하면 전부 낮음이 되어 신호가 죽는다.
    confidence:
      last3.length < 3
        ? "low"
        : (Math.max(...last3) - Math.min(...last3)) / cycle > 1.5
          ? "low"
          : "ok",
  };
}

export const STATE_LABEL = {
  inCycle: "활동 주기 안",
  soon: "슬슬 나올 때",
  overdue: "기다리는 중",
};

/**
 * 일수를 사람이 체감하는 단위로. 825 → "2년 3개월"
 * 825 는 추상적이지만 2년 3개월은 즉시 와닿는다. 둘을 같이 보여준다.
 * 한 달 미만은 환산해도 정보가 없으니 null.
 */
export function humanDuration(days) {
  if (days == null || days < 31) return null;
  const y = Math.floor(days / 365);
  const m = Math.round((days - y * 365) / 30.44);
  if (m >= 12) return `${y + 1}년`;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

/**
 * 상태 문구. 같은 사실을 두 가지로 말할 수 있어서 더 세게 박히는 쪽을 고른다.
 *   많이 넘겼으면 배수 ("평균 컴백 주기의 5.3배") — 크기가 즉시 전달된다
 *   조금 넘겼으면 일수 ("평균보다 20일 더")       — 배수는 1.1배라 밋밋하다
 */
export function stateText(a, comebackCount = 0) {
  if (!a.last) return "컴백 기록 없음";
  if (!a.enough) return `컴백 ${comebackCount}회 · 데이터 부족`;
  if (a.state !== "overdue") return STATE_LABEL[a.state];
  return a.ratio >= 1.5
    ? `평균 컴백 주기의 ${a.ratio.toFixed(1)}배`
    : `평균보다 ${a.over.toLocaleString("ko-KR")}일 더 기다리는 중`;
}

export const fmtDate = (d) =>
  typeof d === "string"
    ? d.replace(/-/g, ".")
    : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
