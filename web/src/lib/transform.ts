export const TRANSFORM_ENDPOINT = "/v1/transform";

export type NoiseType = "typo" | "repeat" | "spacing" | "punct";
export type Language = "zh" | "en";

export interface TransformRequest {
  text: string;
  frequency?: number;
  seed?: string | number;
  types?: NoiseType[];
  languages?: Language[];
}

export interface TransformSuccessResponse {
  output: string;
  changed: boolean;
  seed?: string | number;
}

export interface TransformErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export type TransformResponse = TransformSuccessResponse | TransformErrorResponse;
