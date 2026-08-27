"use client";

import { useEffect, useState } from "react";
import { analyze, STATE_LABEL, fmtDate } from "../../lib/calc";

const CLS = { inCycle: "card--in", soon: "card--soon", overdue: "card--over" };

/** hue 가 없으면(흑백 커버) 채도를 0 으로 떨어뜨려 회색으로 둔다 */
const teamStyle = (hue) =>
  hue == null ? undefined : { "--team-h": hue, "--team-s": "52%" };

/**
 * 공백기는 매일 늘어나므로 브라우저에서 오늘 날짜로 다시 계산한다.
 * 서버(빌드 시점) 값을 먼저 그려서 검색엔진과 첫 화면이 비어 보이지 않게 하고,
 * 마운트 후 실제 오늘 날짜로 갱신한다.
 */
export default function HiatusCard({ artist, buildDate }) {
  const [now, setNow] = useState(() => new Date(buildDate));

  useEffect(() => {
    setNow(new Date());
  }, []);

  const a = analyze(artist.comebacks, now);

  if (!a.last) {
    return (
      <div className="card card--none" style={teamStyle(artist.hue)}>
        <p className="artist">
          <b>{artist.name}</b>
          <span>{artist.nameKo}</span>
        </p>
        <p className="bignum">—</p>
        <span className="state">컴백 기록 없음</span>
      </div>
    );
  }

  const cls = a.enough ? CLS[a.state] : "card--none";

  // 최근 4번의 간격 + 진행 중인 공백기
  const past = (a.gapList ?? []).slice(-4);
  const series = [...past, a.hiatus];
  const max = Math.max(...series, 1);

  const cover = artist.comebacks.at(-1);

  return (
    <div
      className={`card ${cls}${artist.hue == null ? "" : " card--tinted"}`}
      style={teamStyle(artist.hue)}
    >
      <p className="artist">
        <b>{artist.name}</b>
        <span>{artist.nameKo}</span>
      </p>

      <p className="bignum">
        {a.hiatus.toLocaleString("ko-KR")}
        <i>일째</i>
      </p>

      {a.enough ? (
        <span className="state">
          {a.state === "overdue"
            ? `평균보다 ${a.over.toLocaleString("ko-KR")}일 더 기다리는 중`
            : STATE_LABEL[a.state]}
        </span>
      ) : (
        <span className="state">컴백 {artist.comebacks.length}회 · 데이터 부족</span>
      )}

      {series.length > 1 && (
        <>
          <div className="bars" aria-hidden="true">
            {series.map((g, i) => (
              <i
                key={i}
                className={i === series.length - 1 ? "now" : undefined}
                style={{ height: `${Math.max(6, (g / max) * 100)}%` }}
              />
            ))}
          </div>
          <p className="barcap">
            최근 간격 {past.join(" · ")}
            {past.length ? " · " : ""}
            <b>{a.hiatus} (진행 중)</b>
          </p>
        </>
      )}

      {cover?.artwork && cover.url ? (
        <a className="album" href={cover.url} target="_blank" rel="noopener noreferrer">
          <img src={cover.artwork} width={56} height={56} alt="" loading="lazy" />
          <span>
            <b>{cover.name}</b>
            <small>Apple Music에서 듣기 ↗</small>
          </span>
        </a>
      ) : null}

      <dl className="facts">
        <div>
          <dt>마지막 컴백</dt>
          <dd>{fmtDate(a.last.date)}</dd>
        </div>
        <div>
          <dt>평균 컴백 주기</dt>
          <dd>{a.enough ? `${a.cycle}일` : "—"}</dd>
        </div>
        <div>
          <dt>다음 컴백 예상</dt>
          <dd>
            {!a.forecast
              ? "—"
              : a.forecast.to < now
                ? "예상 시기 지남"
                : `${fmtDate(a.forecast.from)} ~ ${fmtDate(a.forecast.to)}`}
            {a.confidence === "low" && a.forecast && a.forecast.to >= now ? (
              <>
                {" "}
                <small>신뢰도 낮음</small>
              </>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>누적 컴백</dt>
          <dd>{artist.comebacks.length}회</dd>
        </div>
      </dl>

      <p className="stamp">
        <span>정규·미니 기준 · 자동 집계</span>
        <b>공백기 며칠째</b>
      </p>
    </div>
  );
}
