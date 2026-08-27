import Link from "next/link";
import { notFound } from "next/navigation";
import { artists, getArtist } from "../../../lib/data";
import { gaps, fmtDate } from "../../../lib/calc";

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
  return {
    title: `${a.name} 컴백 이력 전체 (${a.comebacks.length}회)`,
    description: `${a.name}(${a.nameKo})의 정규·미니 앨범 발매 이력과 컴백 간격.`,
    alternates: { canonical: `/${a.slug}/history/` },
  };
}

export default async function HistoryPage({ params }) {
  const { artist: slug } = await params;
  const artist = getArtist(slug);
  if (!artist) notFound();
  const g = gaps(artist.comebacks);

  return (
    <main>
      <h1 className="page">{artist.name} 컴백 이력</h1>
      <p className="lead">
        {artist.nameKo} · 정규·미니 앨범 {artist.comebacks.length}회
      </p>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>발매일</th>
              <th>앨범</th>
              <th className="n">곡</th>
              <th className="n">직전 간격</th>
            </tr>
          </thead>
          <tbody>
            {[...artist.comebacks].reverse().map((c, i) => {
              const idx = artist.comebacks.length - 1 - i;
              return (
                <tr key={c.date + c.name}>
                  <td>
                    {c.artwork && c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        <img
                          className="hist-cover"
                          src={c.artwork}
                          width={40}
                          height={40}
                          alt=""
                          loading="lazy"
                        />
                      </a>
                    ) : null}
                  </td>
                  <td className="n">{fmtDate(c.date)}</td>
                  <td>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer">
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="n">{c.tracks}</td>
                  <td className="n">{idx > 0 ? `${g[idx - 1]}일` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rowlinks">
        <Link href={`/${artist.slug}/`}>← {artist.name} 공백기</Link>
        <Link href="/">다른 아이돌</Link>
      </div>
    </main>
  );
}
