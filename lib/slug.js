/** 팀 이름을 URL 에 쓸 수 있는 형태로. "&TEAM" → "and-team" */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
