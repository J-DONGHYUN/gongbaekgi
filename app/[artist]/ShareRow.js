"use client";

import { useState } from "react";
import { analyze } from "../../lib/calc";

/** 캡처가 어려운 사람을 위한 보조 장치. 공유는 대부분 스크린샷으로 일어난다. */
export default function ShareRow({ artist }) {
  const [copied, setCopied] = useState(false);
  const url = `https://gongbaekgi.vercel.app/${artist.slug}/`;

  const a = analyze(artist.comebacks, new Date());
  const text = !a.last
    ? `${artist.name} 컴백 기록`
    : a.enough && a.state === "overdue"
      ? `${artist.name} 공백기 ${a.hiatus.toLocaleString("ko-KR")}일째 — 평균보다 ${a.over.toLocaleString("ko-KR")}일 더 기다리는 중`
      : `${artist.name} 공백기 ${a.hiatus.toLocaleString("ko-KR")}일째`;

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rowlinks">
      <a href={tweet} target="_blank" rel="noopener noreferrer">
        X에 공유
      </a>
      <button type="button" className="linklike" onClick={copy}>
        {copied ? "복사했어요" : "링크 복사"}
      </button>
    </div>
  );
}
