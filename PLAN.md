# 공백기 며칠째 — 실행 계획

아이돌이 마지막 컴백 이후 며칠째인지, 평균 주기를 넘겼는지 보여주는 정적 사이트.
백엔드 없이 2일 안에 Vercel 배포까지.

설계서 전문: https://claude.ai/code/artifact/23aa8f23-e1dd-46fc-9324-bfe83445c5bd

---

## 확정된 결정 (변경 시 이 문서 갱신)

| 항목 | 결정 |
|---|---|
| 컴백 정의 | **정규·미니만** (리패키지 포함, 싱글·디지털싱글·OST·피처링 제외) |
| 메인 화면 | **공백기 카운터** (랭킹 아님 — 팬덤 정서 리스크) |
| 데이터 정확도 | **자동 집계 그대로 + 오차 명시** (수동 검수 안 함) |
| 커버 범위 | **인기 30~50팀** |
| 데이터 소스 | **Spotify Web API** (Client Credentials) |
| 스택 | Next.js SSG + 정적 JSON, 서버 함수 0 |
| 호스팅 | Vercel Hobby (무료) |

---

## 검증된 사실

- **벅스 크롤 불가** — robots.txt가 화이트리스트 방식. 검색엔진 봇만 허용, `User-agent: *` → `Disallow: /`
- **Spotify `/v1/artists/{id}/albums`** 가 `release_date`, `release_date_precision`, `album_type`, `total_tracks` 반환. Client Credentials로 사용자 로그인 없이 접근 가능
- **Vercel Hobby** — 전송 100GB/월, 일 배포 100회, 빌드 45분/배포, 정적 업로드 100MB. 우리는 함수 호출 0회라 여유 큼
- **Vercel Hobby 제약** — ① 비상업 용도만 ② Git **조직** 소유 저장소 연결 불가 → **개인 계정 소유로 저장소 생성** ③ 도메인 구입비 별도

## 미확인 (착수 전 확인 필요)

- [ ] Spotify 2026년 2월 Dev Mode 변경 이후 쿼터 정책. 30~50팀 1회 수집이 가능한지
  https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide

---

## 현재 상태 (2026-08-27)

**데이터 소스가 Spotify → iTunes 로 바뀌었습니다. API 키가 필요 없습니다.**
Spotify Web API 는 2026년부터 앱 소유자에게 Premium 구독을 요구해 모든 엔드포인트가 403.
Deezer 도 검토했으나 K-pop 카탈로그가 비어 있어 탈락 (TWICE·NewJeans·IU 가 정규/미니 0장).

- 아티스트 ID **43/43팀 확보 완료**
- 컴백 추출 파이프라인 동작 확인, 필터 1차 조정 완료
- **판정 게이트: aespa 10건 전량 정확.** IVE·NewJeans 는 일본 발매반이 1~2건 섞임

**Day 1 완료 + Day 2 대부분 완료. 남은 것은 Vercel 배포와 홍보뿐.**

```bash
npm run ids         # ID 재확인 (미리보기)
npm run ids:apply   # ID 기록
npm run fetch:test  # 3팀만 콘솔 출력, 저장 안 함 ← 판정 게이트용
npm run fetch       # 전체 43팀 → data/artists.json
npm run dev         # 로컬 미리보기 http://localhost:3000
npm run build       # 정적 내보내기 → out/
```

### 만들어진 것

- `lib/data.js` 슬러그·조회, `lib/calc.js` 공백기·중앙값 주기·예상 범위
- `app/[artist]/HiatusCard.js` 카운터 카드 (클라이언트에서 오늘 날짜로 재계산)
- `app/page.js` 검색+목록, `app/[artist]/history/` 이력표, `app/guide/` 계산 방식
- 정적 페이지 92개, 서버 함수 0, sitemap 88 URL, robots.txt
- 페이지별 고유 title에 숫자 포함 — `NewJeans 공백기 825일째 · 다음 컴백은?`

### 남은 작업

- [ ] **Vercel 배포** — GitHub 저장소를 **개인 계정 소유**로 만들고 push → Vercel 연결
- [ ] 배포 후 `metadataBase`·`sitemap.js`·`robots.js` 의 도메인을 실제 주소로 교체
- [ ] 구글 서치콘솔 + 네이버 서치어드바이저 등록
- [ ] 폰에서 스크린샷 찍어 한 화면에 들어오는지 확인 ← 홍보 성패가 여기 달림
- [ ] 트위터 공유 (공백기 긴 팀부터)

### 남은 데이터 이슈

제목에 "Japanese" 가 없는 일본 발매반이 걸러지지 않는다 (IVE `WAVE`·`Be Alright`, NewJeans `NJWMX`).
**단 이들은 이력 중간에 끼는 것이라 공백기 숫자 자체는 정확하다** — 평균 주기만 약간 짧아진다.
규칙을 무한히 늘리기보다, 팀별로 안 맞으면 목록에서 빼는 편이 빠르다.

### iTunes 에서 배운 것 (다시 헤매지 말 것)

- 아티스트 검색은 K-pop 에 부정확 → **앨범 검색 + `attribute=artistTerm`** 으로 artistId 역추적
- 한국 스토어는 팀명이 한글인 경우가 많다 (BTS→방탄소년단) → 영문·한글 둘 다로 검색
- `normalize("NFD")` 는 한글을 자모로 분해한다 → 악센트만 지우고 **NFC 로 되돌린 뒤** 필터링
- (G)I-DLE 은 `i-dle` 로 개명, LISA 는 스토어 등록명이 `리사 (LISA)`, &TEAM 은 J-Pop 태그가 정상

---

## Day 1 — 숫자가 맞는지 증명 (목표: 검증된 JSON)

- [ ] **[사용자]** Spotify 개발자 대시보드에서 앱 등록 → Client ID / Secret 확보 `0.5h`
      https://developer.spotify.com/dashboard
- [ ] `.env` 채우고 `npm run check` 로 토큰 발급 확인
- [ ] **[사용자]** 아티스트 30~50팀 Spotify ID를 눈으로 확인해 `scripts/artists.config.json` 에 입력 `0.5h`
      검색 API는 동명이인·커버 계정이 섞임. 손으로 확정하면 오류의 절반이 사라짐
- [ ] `npm run fetch:test` — 3팀 결과 콘솔 확인 `1.5h`
- [ ] 중복 제거·컴백 판정 규칙 조정 `2h` ← **가장 오래 걸림**
      `scripts/fetch.mjs` 상단 `MIN_TRACKS` / `EXCLUDE_WORDS` / `normalizeKey()` 를 손본다

### ⛔ 판정 게이트 — Day 1 오후

- [ ] **3팀의 컴백 목록을 나무위키 컴백 이력과 한 줄씩 대조**
      - 빠진 컴백이 있는가
      - 없어야 할 항목이 있는가
      - 간격이 30일 미만인 항목 = 중복 제거 실패 신호

> **통과하면** 나머지는 전부 평범한 작업.
> **오후 6시까지 안 맞으면** 커버 범위를 10팀으로 줄이고 그 10팀만 확실히 맞출 것.
> 틀린 데이터보다 없는 게 낫다.

- [ ] 전체 순회 → `data/artists.json` 생성 `1h`
- [ ] Next.js 생성 + Vercel 연결 + **빈 페이지 먼저 배포** `1h`
      배포 문제를 Day 2로 넘기지 않는 게 목적

---

## Day 2 — 화면과 공개 (목표: 공유 가능한 URL)

- [ ] 공백기 카운터 화면 `3h` ← **시간을 여기 몰아줄 것**
- [ ] 아티스트 검색 + 홈 `1h`
- [ ] 이력 페이지 + 가이드 페이지 `1h`
- [ ] 모바일 확인 + **스크린샷 테스트** `1h`
      폰 세로에서 스크롤 없이 한 화면, 하단에 도메인이 찍히는지
- [ ] 배포 + 서치콘솔·네이버 서치어드바이저 등록 + 첫 공유 `1h`

### 시간이 모자라면 버리는 순서

가이드 페이지 → 이력 페이지 → 검색창.
**카운터 하나만 있어도 배포한다.**

---

## 컴백 판정 규칙

```
1차  include_groups="album"        // single, appears_on, compilation 배제
2차  total_tracks >= 4  → 인정      // 미니 4~7곡, 정규 9곡+
     total_tracks <= 3  → 제외      // 싱글앨범 성격
3차  이름 제외(대소문자 무시):
       Remix / Instrumental / Live / Karaoke / OST
       Japanese / Japan Edition / Chinese
     Repackage 는 유지              // 활동하므로 컴백
4차  release_date_precision == "day" → 사용
     "month"/"year" → 해당 월 1일로 근사하고 근사 표시
5차  같은 날 여러 장 → 1회로 합산
```

> `total_tracks >= 4` 는 임의의 선. Day 1에 실제 데이터 보고 조정하되,
> **이 숫자 하나가 공백기 전체를 바꾼다.**

## 계산 로직

```
간격[]   = 인접 컴백 일수 차
기준주기 = median(간격 최근 5개)     // 평균 아님, 이상치 방어
공백기   = 오늘 - 마지막컴백일        // 브라우저에서 계산
비율     = 공백기 / 기준주기

< 0.7      "활동 주기 안"
0.7 ~ 1.0  "슬슬 나올 때"
>= 1.0     "평균보다 N일 더 기다리는 중"   (강조색)

예상범위 = 마지막컴백일 + [min(최근3회), max(최근3회)]
컴백 3회 미만 → "데이터 부족", 예측 숨김
```

---

## 절대 하지 말 것

- 브라우저에서 Spotify 직접 호출 (Secret 노출)
- `.env` 커밋
- 데이터베이스 / API 라우트 / 로그인
- 랭킹 화면 (팬덤 조리돌림으로 읽힘)
- 이미지로 저장 버튼 (캔버스 필요, 캡처로 충분)
- 동적 OG 이미지 (서버 함수 필요, v4)
- 아티스트 사진·앨범 커버 (저작권)
- 수집 자동화 (v3)
- 정규화 규칙 무한 확장 — 안 맞는 팀은 목록에서 빼는 게 빠름

## 문구 톤

"방치 중" ✗ → "기다리는 중" ✓
공백기가 길다는 걸 조롱이 아니라 기다림으로 읽히게.

---

## 배포 후 첫 주에 볼 것 하나

방문자 수도 검색 유입도 아님. **팬이 캡처를 올렸는가.**
한 장이라도 올라오면 가설이 맞은 것 → 커버 팀 확대.
2주간 0장이면 화면·문구를 고칠 것.

검색 유입은 3~6개월 뒤. 첫 주에 0인 건 정상.
