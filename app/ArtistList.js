"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { analyze, humanDuration } from "../lib/calc";

const CLS = { inCycle: "d-in", soon: "d-soon", overdue: "d-over" };

function Row({ a }) {
  return (
    <Link
      className={`item${a.hue == null ? "" : " item--tinted"}`}
      href={`/${a.slug}/`}
      style={a.hue == null ? undefined : { "--team-h": a.hue, "--team-s": "52%" }}
    >
      <span className="nm">
        <b>{a.name}</b>
        <span>{a.nameKo}</span>
      </span>
      <span className="ddwrap">
        <span className={`dd ${a.cls}`}>
          {a.hiatus?.toLocaleString("ko-KR") ?? "—"}
          <small>일</small>
        </span>
        {a.human ? <span className="ddsub">{a.human}</span> : null}
      </span>
    </Link>
  );
}

export default function ArtistList({ artists }) {
  const [q, setQ] = useState("");
  const now = useMemo(() => new Date(), []);

  const ranked = useMemo(() => {
    const rows = artists.map((a) => {
      const r = analyze(a.comebacks, now);
      return {
        ...a,
        hiatus: r.hiatus,
        human: humanDuration(r.hiatus),
        enough: r.enough,
        cls: r.enough ? CLS[r.state] : "d-none",
      };
    });
    const by = (x, y) => (y.hiatus ?? -1) - (x.hiatus ?? -1);
    // 컴백 3회 미만인 팀은 주기를 낼 수 없어 아예 목록에서 제외했다
    // (scripts/artists.config.json 의 disabled)
    return rows.sort(by);
  }, [artists, now]);

  const term = q.trim().toLowerCase();
  const match = (a) =>
    a.name.toLowerCase().includes(term) || (a.nameKo ?? "").includes(term);

  const shownRanked = term ? ranked.filter(match) : ranked;
  const none = shownRanked.length === 0;

  return (
    <>
      <input
        className="search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="아이돌 이름 검색 — 에스파, IVE, 방탄…"
        aria-label="아이돌 이름 검색"
      />

      {none ? (
        <p className="empty">
          찾는 아이돌이 없습니다. 아직 {artists.length}팀만 담겨 있어요.
        </p>
      ) : (
        <>
          {shownRanked.length > 0 && (
            <div className="grid">
              {shownRanked.map((a) => (
                <Row key={a.slug} a={a} />
              ))}
            </div>
          )}

        </>
      )}
    </>
  );
}
