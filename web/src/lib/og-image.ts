import { SEO_COPY, UI_COPY, isUiLang, type UiLang } from "@/lib/i18n";

const OG_FONT: Record<
  UiLang,
  {
    headline: string;
    headlineSize: number;
    headlineLines: string[];
    headlineLineGap: number;
    proof: string;
    proofSize: number;
    proofLines: string[];
    proofY: number;
    proofLineGap: number;
  }
> = {
  en: {
    headline: "Space Grotesk, IBM Plex Sans, Arial, sans-serif",
    headlineSize: 56,
    headlineLines: ["Make text less polished"],
    headlineY: 184,
    headlineLineGap: 78,
    proof: "IBM Plex Sans, Arial, sans-serif",
    proofSize: 33,
    proofLines: ["Inject small mistakes so text", "feels more hand-written"],
    proofY: 252,
    proofLineGap: 42,
  },
  zh: {
    headline: "Noto Sans SC, IBM Plex Sans, Arial, sans-serif",
    headlineSize: 78,
    headlineLines: ["让文本别那么工整"],
    headlineY: 184,
    headlineLineGap: 78,
    proof: "Noto Sans SC, IBM Plex Sans, Arial, sans-serif",
    proofSize: 34,
    proofLines: ["给文本注入一些小错误，", "让它更像手工写出来的"],
    proofY: 250,
    proofLineGap: 44,
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
  const headlineLines = font.headlineLines
    .map((line, index) => {
      const y = font.headlineY + index * font.headlineLineGap;
      return `<text x="0" y="${y}" fill="#17130c" font-family="${font.headline}" font-size="${font.headlineSize}" font-weight="700">${escapeSvgText(line)}</text>`;
    })
    .join("");
  const proofLines = font.proofLines
    .map((line, index) => {
      const y = font.proofY + index * font.proofLineGap;
      return `<text x="2" y="${y}" fill="#6d5b3f" font-family="${font.proof}" font-size="${font.proofSize}" font-weight="500">${escapeSvgText(line)}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${description}</desc>
  <defs>
    <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd724" stop-opacity="0.56"/>
      <stop offset="46%" stop-color="#ffd724" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffd724" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffaf0"/>
      <stop offset="100%" stop-color="#fff4cf"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0f0d08"/>
  <rect x="56" y="56" width="1088" height="518" rx="34" fill="url(#panel)"/>
  <circle cx="250" cy="294" r="156" fill="url(#logoGlow)" opacity="0.82"/>
  <image href="/logo.png" x="140" y="190" width="220" height="220" preserveAspectRatio="xMidYMid meet"/>
  <g transform="translate(420 176)">
    <text x="0" y="68" fill="#17130c" font-family="Space Grotesk, IBM Plex Sans, Noto Sans SC, Arial, sans-serif" font-size="62" font-weight="700">${brandName}</text>
    <rect x="2" y="76" width="138" height="10" rx="5" fill="#ffd724"/>
    ${headlineLines}
    ${proofLines}
  </g>
</svg>`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
