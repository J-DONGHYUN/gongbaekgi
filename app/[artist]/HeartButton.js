"use client";

import { useEffect, useState } from "react";

const KEY = (slug) => `gb:cooldown:${slug}`;

/**
 * "컴백 기다려요" 하트.
 * 쿨다운은 서버가 IP 기준으로 판정한다. 여기 저장하는 값은 화면 표시용일 뿐이라
 * 지워도 서버가 다시 막는다.
 */
export default function HeartButton({ slug, name }) {
  const [until, setUntil] = useState(0);
  const [left, setLeft] = useState(0);
  const [state, setState] = useState("idle"); // idle | sending | sent | off
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // {score, rank}

  useEffect(() => {
    const saved = Number(localStorage.getItem(KEY(slug)) ?? 0);
    if (saved > Date.now()) setUntil(saved);
  }, [slug]);

  useEffect(() => {
    if (!until) return;
    const tick = () => {
      const remain = Math.ceil((until - Date.now()) / 1000);
      setLeft(remain > 0 ? remain : 0);
      if (remain <= 0) setUntil(0);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [until]);

  /**
   * 누르는 즉시 전환한다. 응답을 기다리면 왕복 시간만큼 멈춰 보인다.
   * 서버가 거절하면 그때 되돌린다. 거절은 드물고(쿨다운뿐) 되돌림도 즉시다.
   */
  function send() {
    if (until > Date.now() || state === "sending") return;

    const optimisticEnd = Date.now() + 60_000;
    setUntil(optimisticEnd);
    localStorage.setItem(KEY(slug), String(optimisticEnd));
    setState("sent");
    setError("");
    setResult(null);
    setTimeout(() => setState((s) => (s === "sent" ? "idle" : s)), 2200);

    fetch("/api/vote/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));

        if (res.ok && json.ok) {
          const end = Date.now() + (json.cooldown ?? 60) * 1000;
          localStorage.setItem(KEY(slug), String(end));
          setUntil(end);
          // 지수·등수는 부가 정보라 조금 늦게 채워도 된다
          if (json.score != null) setResult({ score: json.score, rank: json.rank });
          return;
        }

        if (res.status === 429) {
          // 이미 눌렀던 경우. 서버가 알려준 남은 시간으로 맞춘다.
          const end = Date.now() + (json.retryAfter ?? 60) * 1000;
          localStorage.setItem(KEY(slug), String(end));
          setUntil(end);
          setState("idle");
          return;
        }

        if (res.status === 503) {
          setState("off");
          return;
        }
        rollback("잠시 후 다시 시도해주세요");
      })
      .catch(() => rollback("연결에 실패했습니다"));
  }

  function rollback(message) {
    localStorage.removeItem(KEY(slug));
    setUntil(0);
    setLeft(0);
    setState("idle");
    setError(message);
  }

  if (state === "off") return null;

  const cooling = left > 0;

  return (
    <div className="heart-wrap">
      <button
        type="button"
        className={`heart${cooling ? " heart--cool" : ""}${state === "sent" ? " heart--sent" : ""}`}
        onClick={send}
        disabled={cooling || state === "sending"}
        aria-label={`${name} 컴백 기다려요`}
      >
        <span className="heart-icon" aria-hidden="true">♥</span>
        <span className="heart-text">
          {state === "sent"
            ? "전달했어요"
            : cooling
              ? `${left}초 후 다시`
              : "컴백 기다려요"}
        </span>
      </button>
      {result ? (
        <p className="heart-result">
          기다림 <b>{result.score.toLocaleString("ko-KR")}</b>
          {result.rank ? <> · 현재 <b>{result.rank}위</b></> : null}
        </p>
      ) : null}

      <p className="heart-note">
        {error ||
          "로그인 없이 팀마다 1분에 한 번. 다른 팀은 바로 누를 수 있습니다."}
      </p>
    </div>
  );
}
