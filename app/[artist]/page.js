import Link from "next/link";
import { artists, getArtist, fetchedAt } from "../../lib/data";
import { analyze } from "../../lib/calc";
import HiatusCard from "./HiatusCard";

export function generateStaticParams() {
  return artists.map((a) => ({ artist: a.slug }));
}

export async function generateMetadata({ params }) {
  const { artist: slug } = await params;
  const a = getArtist(slug);
  if (!a) return {};
  const r = analyze(a.comebacks);
  const days = r.hiatus != null ? `${r.hiatus}일째` : "기록 없음";
  return {
    title: `${a.name} 공백기 ${days} · 다음 컴백은?`,
    description:
      r.enough
        ? `${a.name}(${a.nameKo})는 마지막 컴백 이후 ${r.hiatus}일째입니다. 평균 컴백 주기는 ${r.cycle}일.`
        : `${a.name}(${a.nameKo})의 컴백 이력과 공백기.`,
    alternates: { canonical: `/${a.slug}/` },
  };
}

export default async function ArtistPage({ params }) {
  const { artist: slug } = await params;
  const artist = getArtist(slug);
  if (!artist) return null;

  return (
    <main>
      <HiatusCard artist={artist} buildDate={fetchedAt} />
      <div className="rowlinks">
        <Link href={`/${artist.slug}/history/`}>컴백 이력 {artist.comebacks.length}회 전체 보기</Link>
        <Link href="/">다른 아이돌</Link>
      </div>
    </main>
  );
}
