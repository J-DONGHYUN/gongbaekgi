import Link from "next/link";
import { REPORT_URL } from "../../lib/site";

export const metadata = {
  title: "계산 방식 — 숫자가 어떻게 나오나",
  description:
    "공백기·평균 컴백 주기·다음 컴백 예상·기다림 순위를 어떻게 계산하는지 실제 숫자로 설명합니다.",
  alternates: { canonical: "/guide/" },
};

export default function Guide() {
  return (
    <main>
      <h1 className="page">계산 방식</h1>
      <p className="lead">
        숨기는 것 없이 그대로 적어둡니다. 실제 숫자로 보여드립니다.
      </p>

      {/* ── 공백기 ─────────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">이 큰 숫자는 뭔가요</h2>

        <div className="ex">
          <div className="ex-row">
            <b>825일째</b>
            <span>마지막 컴백일부터 오늘까지의 날수</span>
          </div>
          <div className="ex-row">
            <b>2년 3개월</b>
            <span>같은 날수를 체감하기 쉽게 바꾼 것</span>
          </div>
        </div>

        <p>
          페이지를 열 때마다 다시 계산합니다. 그래서 <strong>매일 하루씩 늘어납니다.</strong>
        </p>
      </section>

      {/* ── 컴백 정의 ──────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">무엇을 컴백으로 세나요</h2>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>센다</th>
                <th>안 센다</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  정규 앨범<br />
                  미니 앨범 (EP)<br />
                  리패키지 <span className="dim">— 활동을 다시 하니까</span>
                </td>
                <td>
                  싱글 · 디지털 싱글 · 선공개곡 <span className="dim">(3곡 이하)</span><br />
                  리믹스 · 인스트루멘털<br />
                  라이브 음반 · 베스트 앨범<br />
                  OST · 사운드트랙<br />
                  일본 · 중국 현지 발매반
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          <strong>30일 안에 연달아 나온 발매는 한 번으로 묶습니다.</strong>
          싱글에 리믹스를 붙여 EP로 낸 것, 버전을 나눠 며칠 차이로 낸 것이 이 구간에 몰립니다.
          진짜 리패키지는 보통 한 달 이상 뒤에 나와서 따로 셉니다.
        </p>
      </section>

      {/* ── 평균 주기 ──────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">평균 컴백 주기는 어떻게 나오나요</h2>

        <p>
          최근 <strong>5번</strong> 간격의 <strong>중앙값</strong>입니다. 평균이 아닙니다.
        </p>

        <div className="ex">
          <p className="ex-cap">어떤 팀의 최근 5번 간격</p>
          <p className="ex-nums">149 · 391 · 717 · 1827 · 240일</p>
          <div className="ex-row">
            <b>평균 665일</b>
            <span>1827일 하나에 끌려간다</span>
          </div>
          <div className="ex-row ex-row--good">
            <b>중앙값 391일</b>
            <span>이상치에 흔들리지 않는다</span>
          </div>
        </div>

        <p>
          군백기나 활동 중단 같은 이상치 하나가 평균을 통째로 망가뜨립니다.
          그리고 데뷔 초기는 활동이 촘촘해서 <strong>전체 기간을 다 쓰면 실제보다 짧게</strong> 나옵니다.
          최근 5회만 쓰면 이 문제도 함께 해결됩니다.
        </p>
      </section>

      {/* ── 상태 문구 ──────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">&ldquo;평균 주기의 5.3배&rdquo; 같은 건 뭔가요</h2>

        <p>공백기를 평균 주기로 나눈 값에 따라 문구가 바뀝니다.</p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th className="n">공백기 ÷ 주기</th>
                <th>표시</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="n">0.7 미만</td>
                <td>활동 주기 안</td>
              </tr>
              <tr>
                <td className="n">0.7 ~ 1.0</td>
                <td>슬슬 나올 때</td>
              </tr>
              <tr>
                <td className="n">1.0 ~ 1.5</td>
                <td>평균보다 <b>N일</b> 더 기다리는 중</td>
              </tr>
              <tr>
                <td className="n">1.5 이상</td>
                <td>평균 컴백 주기의 <b>N배</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          같은 사실을 두 가지로 말할 수 있어서 <strong>더 잘 와닿는 쪽을 고릅니다.</strong>
          <code>1.1배</code>는 밋밋하고 <code>668일 더</code>는 크기가 안 와닿습니다.
        </p>
      </section>

      {/* ── 예상 ───────────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">다음 컴백 예상은 믿을 만한가요</h2>

        <p>
          <strong>예측이 아니라 범위입니다.</strong> 주기를 중심으로 ±30%
          <span className="dim"> (최소 ±20일)</span> 창을 잡습니다.
        </p>

        <div className="ex">
          <p className="ex-cap">마지막 컴백 2026.07.23 · 주기 147일</p>
          <p className="ex-nums">2026.11 ~ 2027.01</p>
        </div>

        <ul>
          <li>간격 편차가 크면 <strong>신뢰도 낮음</strong>을 함께 표시합니다</li>
          <li>컴백이 3회 미만이면 주기를 낼 수 없어 <strong>데이터 부족</strong>으로 두고 예상을 숨깁니다</li>
          <li>예상 시기가 이미 지났으면 <strong>예상 시기 지남</strong>으로 표시합니다</li>
        </ul>
      </section>

      {/* ── 순위 ───────────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">하트와 순위는 어떻게 정해지나요</h2>

        <p>
          아이돌 페이지의 하트가 <strong>&ldquo;컴백 기다려요&rdquo;</strong> 한 표입니다.
          순위는 표 개수만으로 정하지 않습니다. 그러면 팬덤 인원이 많은 팀이 늘 1위여서
          볼 이유가 없어집니다.
        </p>

        <p className="formula">기다림 = 하트 수 × (1 + 공백기 ÷ 365)</p>

        <div className="ex">
          <p className="ex-cap">같은 1표라도</p>
          <div className="ex-row">
            <b>NewJeans 825일</b>
            <span>1 × (1 + 825÷365) = <b className="hl">3</b></span>
          </div>
          <div className="ex-row ex-row--good">
            <b>소녀시대 1,483일</b>
            <span>1 × (1 + 1483÷365) = <b className="hl">5</b></span>
          </div>
        </div>

        <p>
          <strong>1년 기다릴 때마다 표 한 장의 무게가 1씩 늘어납니다.</strong>
          팬덤이 작아도 오래 기다린 팀이 올라올 수 있고, 컴백 직후 팀은 표가 많아도 내려갑니다.
        </p>

        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>규칙</th>
                <th>이유</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="nm">로그인 없이 누를 수 있다</td>
                <td>가입 절차가 있으면 아무도 안 누릅니다</td>
              </tr>
              <tr>
                <td className="nm">한 팀당 1분에 한 번</td>
                <td>다른 팀은 바로 누를 수 있습니다</td>
              </tr>
              <tr>
                <td className="nm">최근 이틀치만 집계</td>
                <td>계속 쌓으면 순위가 굳고, 한 번 몰린 표가 영구히 남습니다</td>
              </tr>
              <tr>
                <td className="nm">하트 개수는 공개하지 않는다</td>
                <td>조작 성과가 눈에 보이면 조작할 이유가 생깁니다</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 한계 ───────────────────────────── */}
      <section className="qa">
        <h2 className="qa-q">데이터가 틀렸으면</h2>

        <p>
          발매 정보는 <strong>Apple Music 카탈로그에서 자동으로</strong> 모읍니다.
          자동 집계라 실제와 다를 수 있습니다.
        </p>

        <p>
          알려진 한계가 하나 있습니다. 제목에 &lsquo;Japanese&rsquo;가 없는
          일본 발매반은 걸러지지 않아 컴백으로 잡히기도 합니다.
          이 경우 <strong>공백기 자체는 맞지만 평균 주기가 실제보다 짧게</strong> 나옵니다.
        </p>

        <p>
          틀린 곳을 발견하시면 알려주세요. 고치겠습니다.
          {REPORT_URL ? (
            <>
              {" "}
              <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">
                <strong>제보하기 →</strong>
              </a>
            </>
          ) : null}
        </p>
      </section>

      <div className="rowlinks">
        <Link href="/">← 전체 목록</Link>
      </div>
    </main>
  );
}
