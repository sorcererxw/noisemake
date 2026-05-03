import type { APIRoute } from "astro";

import { SEO_COPY, UI_COPY, isUiLang, type UiLang } from "@/lib/i18n";

export const prerender = false;

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

export const GET: APIRoute = ({ params }) => {
  const lang = isUiLang(params.lang) ? params.lang : "en";

  return new Response(renderOgSvg(lang), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderOgSvg(lang: UiLang) {
  const uiCopy = UI_COPY[lang];
  const seoCopy = SEO_COPY[lang];
  const font = OG_FONT[lang];
  const title = escapeSvgText(seoCopy.ogTitle);
  const description = escapeSvgText(seoCopy.ogDescription);
  const headline = escapeSvgText(uiCopy.headline);
  const proof = escapeSvgText(uiCopy.proof);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${description}</desc>
  <rect width="1200" height="630" fill="#fffaf0"/>
  <rect x="48" y="48" width="1104" height="534" rx="28" fill="#ffffff" stroke="#eadfca" stroke-width="2"/>
  <g transform="translate(92 84)">
    <rect width="64" height="64" rx="16" fill="#f9c74f" stroke="#2b2111" stroke-width="4"/>
    <circle cx="24" cy="26" r="5" fill="#2b2111"/>
    <circle cx="43" cy="22" r="5" fill="#2b2111"/>
    <path d="M19 43 L29 39 L38 45 L48 40" fill="none" stroke="#2b2111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="84" y="45" fill="#241c12" font-family="Space Grotesk, IBM Plex Sans, Noto Sans SC, Arial, sans-serif" font-size="42" font-weight="700">noisemake</text>
  </g>
  <text x="92" y="308" fill="#241c12" font-family="${font.headline}" font-size="78" font-weight="700">${headline}</text>
  <text x="96" y="392" fill="#66543a" font-family="${font.proof}" font-size="36" font-weight="500">${proof}</text>
</svg>`;
}
