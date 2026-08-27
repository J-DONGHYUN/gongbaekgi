/** 사이트 전역 설정 */
export const SITE_URL = "https://gongbaekgi.vercel.app";
export const SITE_NAME = "공백기 며칠째";

/**
 * 검색엔진 소유권 확인 코드.
 *
 *   구글  : Search Console → 속성 추가 → URL 접두어 → HTML 태그
 *           <meta name="google-site-verification" content="여기값"> 에서 content 만
 *   네이버: 서치어드바이저 → 웹마스터도구 → 사이트 등록 → HTML 태그
 *           <meta name="naver-site-verification" content="여기값"> 에서 content 만
 *
 * 값이 비어 있으면 태그를 아예 넣지 않는다.
 */
export const VERIFY = {
  google: "",
  naver: "",
};

/**
 * 데이터 오류 제보를 받을 곳 (구글 폼 주소).
 *
 *   forms.google.com → 빈 양식 → 아래 3개 질문만 만들고
 *   오른쪽 위 "보내기" → 링크 아이콘 → URL 복사해서 여기 붙여넣기
 *
 *     1. 어느 아이돌인가요            (단답형, 필수)
 *     2. 무엇이 틀렸나요              (장문형, 필수)
 *     3. 맞는 정보를 아신다면          (장문형, 선택)
 *
 * 비어 있으면 제보 링크를 아예 표시하지 않는다.
 * 받을 곳 없이 "알려주세요"라고만 적어두면 지적이 공개 인용으로 간다.
 */
export const REPORT_URL = "";
