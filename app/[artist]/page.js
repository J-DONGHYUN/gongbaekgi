import Link from "next/link";
import { notFound } from "next/navigation";
import { artists, getArtist, fetchedAt } from "../../lib/data";
import { analyze } from "../../lib/calc";
import HiatusCard from "./HiatusCard";
import ShareRow from "./ShareRow";
import HeartButton from "./HeartButton";

// generateStaticParams 에 없는 주소는 404. 이게 없으면 Next 가 즉석에서
// 빈 페이지를 만들어 200 을 돌려준다 (제외한 팀이 살아 있는 것처럼 보인다).
export const dynamicParams = false;

export function generateStaticParams() {
  return artists.map((a) => ({ artist: a.slug }));
}

export async function generateMetadata({ params }) {
  const { artist: slug } = await params;
  const a = getArtist(slug);
  if (!a) return {};
  const r = analyze(a.comebacks);
  const days = r.hiatus != null ? `${r.hiatus}일째` : "기록 없음";
  const title = `${a.name} 공백기 ${days} · 다음 컴백은?`;
  const description = r.enough
    ? `${a.name}(${a.nameKo})는 마지막 컴백 이후 ${r.hiatus}일째입니다. 평균 컴백 주기는 ${r.cycle}일.`
    : `${a.name}(${a.nameKo})의 컴백 이력과 공백기.`;
  const url = `/${a.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // 링크를 공유했을 때 미리보기에 숫자가 그대로 보이게 한다
    openGraph: {
      title, description, url,
      siteName: "공백기 며칠째", type: "website", locale: "ko_KR",
      images: [{ url: `/og/${a.slug}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title, description,
      images: [`/og/${a.slug}.png`],
    },
  };
}

export default async function ArtistPage({ params }) {
  const { artist: slug } = await params;
  const artist = getArtist(slug);
  if (!artist) notFound();

  return (
    <main>
      <HiatusCard artist={artist} buildDate={fetchedAt} />
      <HeartButton slug={artist.slug} name={artist.name} />
      <ShareRow artist={artist} />
      <div className="rowlinks">
        <Link href={`/${artist.slug}/history/`}>컴백 이력 {artist.comebacks.length}회 전체 보기</Link>
        <Link href="/">다른 아이돌</Link>
      </div>
    </main>
  );
}
