import type { APIRoute } from "astro";

import { normalizeOgLang, renderOgSvg } from "@/lib/og-image";

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
  const lang = normalizeOgLang(params.lang);

  return new Response(renderOgSvg(lang), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
