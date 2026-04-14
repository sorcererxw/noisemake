import type { APIRoute } from "astro";
import { noisemake } from "noisemake";

import type {
  Language,
  NoiseType,
  TransformErrorResponse,
  TransformRequest,
  TransformSuccessResponse,
} from "@/lib/transform";

export const prerender = false;

const MAX_TEXT_LENGTH = 20_000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return jsonError(
      415,
      "unsupported_media_type",
      "Send JSON with Content-Type: application/json.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  const parsed = parseTransformRequest(body);
  if ("error" in parsed) {
    return jsonError(400, parsed.error.code, parsed.error.message, parsed.error.field);
  }

  try {
    const output = noisemake(parsed.text, {
      frequency: parsed.frequency,
      seed: parsed.seed,
      types: parsed.types,
      languages: parsed.languages,
    });

    return json<TransformSuccessResponse>({
      output,
      changed: output !== parsed.text,
      seed: parsed.seed,
    });
  } catch (error) {
    return jsonError(
      400,
      "invalid_options",
      error instanceof Error ? error.message : "Invalid transform options.",
    );
  }
};

export const GET: APIRoute = methodNotAllowed;
export const PUT: APIRoute = methodNotAllowed;
export const PATCH: APIRoute = methodNotAllowed;
export const DELETE: APIRoute = methodNotAllowed;

function parseTransformRequest(body: unknown): TransformRequest | TransformErrorResponse {
  if (!isRecord(body)) {
    return parseError("invalid_body", "Request body must be a JSON object.");
  }

  if (typeof body.text !== "string") {
    return parseError("invalid_text", "`text` must be a string.", "text");
  }

  if (body.text.length > MAX_TEXT_LENGTH) {
    return parseError(
      "text_too_large",
      `Text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
      "text",
    );
  }

  const frequency = readOptionalNumber(body.frequency, "frequency");
  if ("error" in frequency) {
    return frequency;
  }

  const seed = readOptionalSeed(body.seed);
  if ("error" in seed) {
    return seed;
  }

  const types = readOptionalStringArray<NoiseType>(body.types, "types");
  if ("error" in types) {
    return types;
  }

  const languages = readOptionalStringArray<Language>(body.languages, "languages");
  if ("error" in languages) {
    return languages;
  }

  return {
    text: body.text,
    frequency: frequency.value,
    seed: seed.value,
    types: types.value,
    languages: languages.value,
  };
}

function readOptionalNumber(
  value: unknown,
  field: string,
): { value?: number } | TransformErrorResponse {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== "number") {
    return parseError("invalid_number", `\`${field}\` must be a number.`, field);
  }

  return { value };
}

function readOptionalSeed(value: unknown): { value?: string | number } | TransformErrorResponse {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return parseError("invalid_seed", "`seed` must be a string or number.", "seed");
  }

  return { value };
}

function readOptionalStringArray<T extends string>(
  value: unknown,
  field: string,
): { value?: T[] } | TransformErrorResponse {
  if (value === undefined) {
    return {};
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return parseError("invalid_array", `\`${field}\` must be an array of strings.`, field);
  }

  return { value: value as T[] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseError(
  code: string,
  message: string,
  field?: string,
): TransformErrorResponse {
  return {
    error: {
      code,
      message,
      field,
    },
  };
}

function json<T>(payload: T, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function jsonError(
  status: number,
  code: string,
  message: string,
  field?: string,
): Response {
  return json<TransformErrorResponse>(
    {
      error: {
        code,
        message,
        field,
      },
    },
    status,
  );
}

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: {
      ...CORS_HEADERS,
      Allow: "POST, OPTIONS",
    },
  });
}
