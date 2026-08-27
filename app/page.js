import { artists, fetchedAt } from "../lib/data";
import ArtistList from "./ArtistList";

export const metadata = {
  title: "아이돌 공백기 며칠째 — 컴백 주기 한눈에",
  description:
    "아이돌 43팀의 마지막 컴백 이후 경과일과 평균 컴백 주기. 공백기 긴 순으로 정렬.",
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
      <ArtistList artists={artists} buildDate={fetchedAt} />
    </main>
  );
}
