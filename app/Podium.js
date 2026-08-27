"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ORDER = [1, 0, 2]; // 2위 · 1위 · 3위 — 가운데가 가장 높은 삼각형
const LABEL = ["1", "2", "3"];

export default function Podium() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/ranking/", { cache: "no-store" });
        if (alive) setData(await r.json());
      } catch {
        if (alive) setData({ available: false, top: [] });
      }
    };
    load();
    // 요구사항대로 1분마다 갱신
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (data && !data.available) return null;

  const top = data?.top ?? [];

  return (
    <section className="podium-wrap" aria-label="지금 가장 기다림이 큰 팀">
      <h2 className="podium-title">지금 가장 기다림이 큰 팀</h2>

      {data == null ? (
        <p className="podium-empty">불러오는 중…</p>
      ) : top.length === 0 ? (
        <p className="podium-empty">
          아직 오늘의 투표가 없습니다. 아이돌 페이지에서 하트를 눌러 기다림을 보내주세요.
        </p>
      ) : (
        <div className="podium">
          {ORDER.map((i) => {
            const a = top[i];
            if (!a) return <div key={i} className="pod pod--empty" aria-hidden="true" />;
            return (
              <Link
                key={a.slug}
                href={`/${a.slug}/`}
                className={`pod pod--${i + 1}`}
                style={a.hue == null ? undefined : { "--team-h": a.hue, "--team-s": "52%" }}
              >
                <span className="pod-rank">{LABEL[i]}</span>
                <span className="pod-name">{a.name}</span>
                <span className="pod-ko">{a.nameKo}</span>
                <span className="pod-days">{a.hiatus?.toLocaleString("ko-KR")}일째</span>
                <span className="pod-score">
                  기다림 {a.score.toLocaleString("ko-KR")}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <p className="podium-note">
        최근 이틀간 받은 하트에 공백기를 곱해 정합니다. 1분마다 갱신됩니다.
      </p>
    </section>
  );
}
