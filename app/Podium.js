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
    // 15초마다 갱신. 1분이면 투표해도 안 바뀐 것처럼 보인다.
    const t = setInterval(load, 15_000);
    // 다른 탭에서 투표하고 돌아왔을 때 바로 최신으로
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
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
              <div
                key={a.slug}
                className={`pod pod--${i + 1}`}
                style={a.hue == null ? undefined : { "--team-h": a.hue, "--team-s": "52%" }}
              >
                <span className="pod-rank">{LABEL[i]}</span>

                {/* 커버는 Apple Music 으로 간다.
                    iTunes Search API 약관이 아트워크를 스토어 링크 옆에 두라고 요구한다. */}
                {a.artwork && a.appleUrl ? (
                  <a
                    className="pod-cover"
                    href={a.appleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${a.name} 최근 앨범 · Apple Music에서 듣기`}
                  >
                    <img src={a.artwork} alt="" loading="lazy" />
                  </a>
                ) : null}

                <Link className="pod-body" href={`/${a.slug}/`}>
                  <span className="pod-name">{a.name}</span>
                  <span className="pod-ko">{a.nameKo}</span>
                  <span className="pod-days">{a.hiatus?.toLocaleString("ko-KR")}일째</span>
                  <span className="pod-score">
                    기다림 {a.score.toLocaleString("ko-KR")}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <p className="podium-note">
        최근 이틀간 받은 하트에 공백기를 곱해 정합니다. 15초마다 갱신됩니다.
        앨범 표지를 누르면 Apple Music 으로 갑니다.
      </p>
    </section>
  );
}
