/**
 * 한국어 조사 처리.
 *
 * 검색 결과에 그대로 노출되는 문장이라 조사가 틀리면 눈에 띈다.
 * "세븐틴는" 처럼 나가고 있었다.
 */

const isHangul = (ch) => {
  const c = ch.charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3;
};

/**
 * 받침 판정에 쓸 마지막 글자를 찾는다.
 *
 * "SEVENTEEN(세븐틴)" 처럼 괄호로 끝나면 마지막 글자가 ")" 라서
 * 한글 판정이 안 된다. 닫는 괄호·따옴표는 건너뛰고 안쪽 글자를 본다.
 */
function lastMeaningfulChar(word) {
  const s = (word ?? "").trim();
  for (let i = s.length - 1; i >= 0; i--) {
    if (!/[)\]}»"'\s]/.test(s[i])) return s[i];
  }
  return "";
}

/** 마지막 글자에 받침이 있는지 */
function hasBatchim(word) {
  const last = lastMeaningfulChar(word);
  // 한글 음절이 아니면 (영문·숫자) 판단하지 않고 받침 없음으로 둔다
  if (!last || !isHangul(last)) return false;
  return (last.charCodeAt(0) - 0xac00) % 28 !== 0;
}

/**
 * 조사를 붙인다.
 *
 *   josa("세븐틴", "은") → "세븐틴은"
 *   josa("트와이스", "은") → "트와이스는"
 *
 * 받침 있을 때 쓰는 쪽을 넘기면 된다 (은/이/을/과/으로).
 */
const PAIR = { 은: "는", 이: "가", 을: "를", 과: "와", 으로: "로" };

export function josa(word, withBatchim) {
  const without = PAIR[withBatchim];
  if (!without) throw new Error(`모르는 조사: ${withBatchim}`);
  return `${word}${hasBatchim(word) ? withBatchim : without}`;
}
