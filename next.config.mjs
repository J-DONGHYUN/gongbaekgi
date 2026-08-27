/** @type {import('next').NextConfig} */
export default {
  // output: "export" 를 뺐다. 하트 투표에 서버 함수가 필요하다.
  //   페이지는 여전히 전부 정적 생성(SSG)된다. 함수는 /api/* 두 개뿐이다.
  trailingSlash: true,
};
