import Link from "next/link";

export const metadata = {
  title: "계산 방식 — 컴백과 공백기는 이렇게 셉니다",
  description:
    "무엇을 컴백으로 세는지, 평균 컴백 주기와 다음 컴백 예상은 어떻게 계산하는지.",
  alternates: { canonical: "/guide/" },
};

export default function Guide() {
  return (
    <main>
      <h1 className="page">계산 방식</h1>
      <p className="lead">숫자가 어떻게 나오는지 그대로 적어둡니다.</p>

      <div className="prose">
        <h2 className="sec">무엇을 컴백으로 세나</h2>
        <p>
          <strong>정규 앨범과 미니 앨범(EP)만</strong> 컴백으로 셉니다.
          팬이 보통 &ldquo;컴백&rdquo;이라 부르는 활동 단위에 가장 가깝기 때문입니다.
        </p>
        <p>
          다음은 제외합니다 — <strong>싱글·디지털 싱글·선공개곡</strong>(수록곡 3곡 이하),
          리믹스·인스트루멘털, 라이브 음반, OST와 사운드트랙,
          일본·중국 발매반. <strong>리패키지는 포함</strong>합니다. 활동을 다시 하기 때문입니다.
        </p>

        <h2 className="sec">공백기</h2>
        <p>
          마지막 컴백일부터 <strong>오늘</strong>까지의 날수입니다.
          페이지를 열 때마다 다시 계산하므로 매일 하루씩 늘어납니다.
        </p>

        <h2 className="sec">평균 컴백 주기</h2>
        <p>
          <strong>최근 5번의 컴백 간격 중앙값</strong>입니다. 평균이 아닙니다.
          군백기나 활동 중단 같은 이상치 하나가 평균을 통째로 망가뜨리기 때문에,
          가운데 값을 씁니다. 데뷔 초기는 활동이 촘촘해서 전체 평균이 실제보다
          짧게 나오는데, 최근 5회만 쓰면 이 문제도 함께 해결됩니다.
        </p>

        <h2 className="sec">상태 표시</h2>
        <p>
          공백기를 평균 주기로 나눈 값이 기준입니다. <code>0.7</code> 미만이면
          <strong> 활동 주기 안</strong>, <code>1.0</code> 미만이면{" "}
          <strong>슬슬 나올 때</strong>, <code>1.0</code> 이상이면{" "}
          <strong>평균보다 며칠 더 기다리는 중</strong>으로 표시합니다.
        </p>

        <h2 className="sec">다음 컴백 예상</h2>
        <p>
          <strong>예측이 아니라 범위</strong>입니다. 최근 3번의 간격 중 가장 짧은 것과
          가장 긴 것을 마지막 컴백일에 더해 구간으로 보여줍니다. 간격 편차가 크면
          &lsquo;신뢰도 낮음&rsquo;을 함께 표시합니다. 컴백이 3회 미만이면 주기를
          말할 수 없어 &lsquo;데이터 부족&rsquo;으로 두고 예상을 숨깁니다.
        </p>

        <h2 className="sec">기다림 순위는 어떻게 정하나</h2>
        <p>
          아이돌 페이지의 하트가 <strong>&ldquo;컴백 기다려요&rdquo;</strong> 한 표입니다.
          로그인 없이 누를 수 있고, 한 팀당 <strong>1분에 한 번</strong>까지입니다.
        </p>
        <p>
          순위는 표 개수만으로 정하지 않습니다. 그러면 팬덤 인원이 많은 팀이 늘 1위여서
          볼 이유가 없어집니다. 그래서 <strong>공백기를 곱합니다.</strong>
        </p>
        <p>
          <code>기다림 = 표 수 × (1 + 공백기 ÷ 365)</code>
        </p>
        <p>
          1년 기다릴 때마다 표 한 장의 무게가 1씩 늘어납니다. 팬덤이 작아도
          오래 기다린 팀이 올라올 수 있고, 컴백 직후 팀은 표가 많아도 내려갑니다.
        </p>
        <p>
          집계는 <strong>최근 이틀</strong>치만 씁니다. 계속 쌓으면 순위가 굳고
          한 번 몰린 표가 영구히 남습니다. 매일 흘려보내야 지금의 기다림이 보입니다.
          표 개수 자체는 공개하지 않습니다.
        </p>

        <h2 className="sec">데이터 출처와 한계</h2>
        <p>
          Apple Music 카탈로그에서 자동으로 모읍니다. <strong>자동 집계라 실제와
          다를 수 있습니다.</strong> 특히 제목에 &lsquo;Japanese&rsquo;가 없는 일본
          발매반은 걸러지지 않아 컴백으로 잡히기도 합니다. 이 경우 공백기 자체는
          맞지만 평균 주기가 실제보다 짧게 나옵니다.
        </p>
        <p>
          틀린 곳을 발견하시면 알려주세요. 고치겠습니다.
        </p>
      </div>

      <div className="rowlinks">
        <Link href="/">← 전체 목록</Link>
      </div>
    </main>
  );
}
