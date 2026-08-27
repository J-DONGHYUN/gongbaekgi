"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { analyze } from "../lib/calc";

const CLS = { inCycle: "d-in", soon: "d-soon", overdue: "d-over" };

function Row({ a }) {
  return (
    <Link className="item" href={`/${a.slug}/`}>
      <span className="nm">
        <b>{a.name}</b>
        <span>{a.nameKo}</span>
      </span>
      <span className={`dd ${a.cls}`}>
        {a.hiatus?.toLocaleString("ko-KR") ?? "—"}
        <small>일</small>
      </span>
    </Link>
  );
}

export default function ArtistList({ artists }) {
  const [q, setQ] = useState("");
  const now = useMemo(() => new Date(), []);

  const { ranked, sparse } = useMemo(() => {
    const rows = artists.map((a) => {
      const r = analyze(a.comebacks, now);
      return {
        ...a,
        hiatus: r.hiatus,
        enough: r.enough,
        cls: r.enough ? CLS[r.state] : "d-none",
      };
    });
    const by = (x, y) => (y.hiatus ?? -1) - (x.hiatus ?? -1);
    return {
      // 컴백 3회 미만은 공백기가 길어 보여도 그건 데이터가 적어서다.
      // 순위에 섞으면 첫 화면이 고장난 것처럼 보이므로 아래로 내린다.
      ranked: rows.filter((r) => r.enough).sort(by),
      sparse: rows.filter((r) => !r.enough).sort(by),
    };
  }, [artists, now]);

  const term = q.trim().toLowerCase();
  const match = (a) =>
    a.name.toLowerCase().includes(term) || (a.nameKo ?? "").includes(term);

  const shownRanked = term ? ranked.filter(match) : ranked;
  const shownSparse = term ? sparse.filter(match) : sparse;
  const none = shownRanked.length === 0 && shownSparse.length === 0;

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

          {shownSparse.length > 0 && (
            <>
              <h2 className="sec">컴백이 3회 미만인 팀</h2>
              <p className="note-inline">
                기록이 적어 평균 주기를 낼 수 없습니다. 공백기만 보여줍니다.
              </p>
              <div className="grid">
                {shownSparse.map((a) => (
                  <Row key={a.slug} a={a} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
