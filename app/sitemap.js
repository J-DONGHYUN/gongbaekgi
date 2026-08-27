export const dynamic = "force-static";
import { artists } from "../lib/data";

const BASE = "https://gongbaekgi.vercel.app";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, priority: 1 },
    { url: `${BASE}/guide/`, lastModified: now, priority: 0.5 },
    ...artists.flatMap((a) => [
      { url: `${BASE}/${a.slug}/`, lastModified: now, priority: 0.9 },
      { url: `${BASE}/${a.slug}/history/`, lastModified: now, priority: 0.6 },
    ]),
  ];
}
