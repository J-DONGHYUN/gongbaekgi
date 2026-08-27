/**
 * 팀 이름을 URL 에 쓸 수 있는 형태로.
 *   "&TEAM" → "and-team"
 *   "ROSÉ"  → "rose"   (악센트를 떼고 알파벳으로. 안 그러면 "ros" 가 된다)
 */
export function slugify(name) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // 라틴 악센트만 제거
    .normalize("NFC") // 한글은 다시 합친다
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
