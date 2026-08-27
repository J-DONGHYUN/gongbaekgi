import raw from "../data/artists.json";
import { slugify } from "./slug";

export { slugify };

export const fetchedAt = raw.fetchedAt;

export const artists = raw.artists
  .map((a) => ({ ...a, slug: slugify(a.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getArtist(slug) {
  return artists.find((a) => a.slug === slug) ?? null;
}
