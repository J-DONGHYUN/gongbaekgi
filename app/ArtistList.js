"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { analyze } from "../lib/calc";

const CLS = { inCycle: "d-in", soon: "d-soon", overdue: "d-over" };

export default function ArtistList({ artists, buildDate }) {
  const [q, setQ] = useState("");
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(() => {
    return artists
      .map((a) => {
        const r = analyze(a.comebacks, now);
        return {
          ...a,
          hiatus: r.hiatus,
          cls: r.enough ? CLS[r.state] : "d-none",
        };
      })
      .sort((a, b) => (b.hiatus ?? -1) - (a.hiatus ?? -1));
  }, [artists, now]);

  const term = q.trim().toLowerCase();
  const shown = term
    ? rows.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          (a.nameKo ?? "").toLowerCase().includes(term)
      )
    : rows;

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

      {shown.length === 0 ? (
        <p className="empty">
          찾는 아이돌이 없습니다. 아직 {artists.length}팀만 담겨 있어요.
        </p>
      ) : (
        <div className="grid">
          {shown.map((a) => (
            <Link className="item" key={a.slug} href={`/${a.slug}/`}>
              <span className="nm">
                <b>{a.name}</b>
                <span>{a.nameKo}</span>
              </span>
              <span className={`dd ${a.cls}`}>
                {a.hiatus?.toLocaleString("ko-KR") ?? "—"}
                <small>일</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
