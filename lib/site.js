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
