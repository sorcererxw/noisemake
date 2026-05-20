import { SEO_COPY, UI_COPY, isUiLang, type UiLang } from "@/lib/i18n";

const OG_FONT: Record<
  UiLang,
  {
    headline: string;
    proof: string;
  }
> = {
  en: {
    headline: "Space Grotesk, IBM Plex Sans, Arial, sans-serif",
    proof: "IBM Plex Sans, Arial, sans-serif",
  },
  zh: {
    headline: "Noto Sans SC, IBM Plex Sans, Arial, sans-serif",
    proof: "Noto Sans SC, IBM Plex Sans, Arial, sans-serif",
  },
};

export function normalizeOgLang(value: unknown): UiLang {
  return isUiLang(value) ? value : "en";
}

export function renderOgSvg(lang: UiLang) {
  const uiCopy = UI_COPY[lang];
  const seoCopy = SEO_COPY[lang];
  const font = OG_FONT[lang];
  const title = escapeSvgText(seoCopy.ogTitle);
  const description = escapeSvgText(seoCopy.ogDescription);
  const brandName = escapeSvgText(uiCopy.brandName);
  const headline = escapeSvgText(uiCopy.headline);
  const proof = escapeSvgText(uiCopy.proof);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${description}</desc>
  <rect width="1200" height="630" fill="#fffaf0"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#ffffff" stroke="#eadfca" stroke-width="2"/>
  <g transform="translate(92 84)">
    <image href="/logo.png" width="72" height="72" preserveAspectRatio="xMidYMid meet"/>
    <text x="92" y="49" fill="#241c12" font-family="Space Grotesk, IBM Plex Sans, Noto Sans SC, Arial, sans-serif" font-size="42" font-weight="700">${brandName}</text>
  </g>
  <text x="92" y="308" fill="#241c12" font-family="${font.headline}" font-size="78" font-weight="700">${headline}</text>
  <text x="96" y="392" fill="#66543a" font-family="${font.proof}" font-size="36" font-weight="500">${proof}</text>
</svg>`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
