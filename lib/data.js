import raw from "../data/artists.json";

/** 팀 이름을 URL 에 쓸 수 있는 형태로 바꾼다. "&TEAM" → "and-team" */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const fetchedAt = raw.fetchedAt;

export const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getArtist(slug) {
  return artists.find((a) => a.slug === slug) ?? null;
}
