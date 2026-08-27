/**
 * 앨범 커버에서 대표 색상(hue)만 뽑는다.
 *
 * 왜 hex 가 아니라 hue 만 저장하나:
 *   ① 채도·명도를 우리가 고정하면 라이트/다크 양쪽에서 항상 읽히는 색이 나온다.
 *      커버가 어두우면 라이트 테마에서 안 보이고, 흐리면 색이 죽는다.
 *   ② 저장하는 게 숫자 하나뿐이다. 이미지를 내려받거나 재배포하지 않는다.
 *
 * 64px 썸네일(약 3.5KB)만 받아서 계산하고 즉시 버린다.
 */

import jpeg from "jpeg-js";

const BINS = 36; // 10도 단위

/** iTunes 아트워크 URL 의 크기를 바꾼다. 100x100bb → 64x64bb */
export function resizeArtwork(url, spec) {
  return url ? url.replace(/\d+x\d+bb/, spec) : null;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/**
 * @returns {Promise<number|null>} 0~359 사이 hue, 색이 거의 없는 커버는 null
 */
export async function dominantHue(artworkUrl) {
  const url = resizeArtwork(artworkUrl, "64x64bb");
  if (!url) return null;

  let pixels;
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    pixels = jpeg.decode(buf, { useTArray: true });
  } catch {
    return null;
  }

  const weight = new Float64Array(BINS);
  const hueSum = new Float64Array(BINS);
  let total = 0;

  for (let i = 0; i < pixels.data.length; i += 4) {
    const [h, s, l] = rgbToHsl(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
    // 무채색·너무 어둡거나 밝은 화소는 버린다 (검정 배경·흰 여백이 색을 지배하지 않게)
    if (s < 0.25 || l < 0.15 || l > 0.9) continue;
    const w = s * (1 - Math.abs(l - 0.5));
    const bin = Math.min(BINS - 1, Math.floor(h / (360 / BINS)));
    weight[bin] += w;
    hueSum[bin] += h * w;
    total += w;
  }

  // 화소의 극히 일부만 유채색이면 흑백 커버로 보고 포기한다
  if (total < 40) return null;

  let best = 0;
  for (let i = 1; i < BINS; i++) if (weight[i] > weight[best]) best = i;
  if (weight[best] <= 0) return null;

  return Math.round(hueSum[best] / weight[best]) % 360;
}
