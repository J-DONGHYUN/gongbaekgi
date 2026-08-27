import { artists, fetchedAt } from "../lib/data";
import ArtistList from "./ArtistList";
import Podium from "./Podium";

// 팀 수를 하드코딩하면 팀을 넣고 뺄 때마다 검색 결과에 틀린 숫자가 남는다.
// 정확도가 이 제품의 전부이므로 데이터에서 세서 쓴다.
export const metadata = {
  title: "아이돌 공백기 며칠째 — 컴백 주기 한눈에",
  description:
    `아이돌 ${artists.length}팀이 마지막 컴백 이후 며칠째인지, ` +
    "평균 컴백 주기를 넘겼는지 한눈에. 매일 자동으로 갱신됩니다.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <h1 className="page">우리 애 며칠째 쉬고 있나</h1>
      <p className="lead">
        마지막 컴백 이후 지난 날과 평균 컴백 주기를 비교해서 보여줍니다.
        정규·미니 앨범만 컴백으로 셉니다.
      </p>
      <Podium />
      <ArtistList artists={artists} buildDate={fetchedAt} />
    </main>
  );
}
