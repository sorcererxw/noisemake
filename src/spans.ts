export type SpanKind = "zh" | "latin";

export interface Span {
  kind: SpanKind;
  text: string;
  start: number;
  end: number;
}

export interface Token extends Span {
  isWordLike: boolean;
}

type SegmenterSegment = {
  segment: string;
  index: number;
  isWordLike?: boolean;
};

type SegmenterLike = {
  segment(text: string): Iterable<SegmenterSegment>;
};

type SegmenterConstructor = new (
  locale: string,
  options: { granularity: "word" },
) => SegmenterLike;

export function toCodePoints(text: string): string[] {
  return Array.from(text);
}

export function findChineseSpans(chars: readonly string[]): Span[] {
  return findSpans(chars, "zh", isHan);
}

export function findLatinSpans(chars: readonly string[]): Span[] {
  return findSpans(chars, "latin", isAsciiLetter);
}

export function segmentWords(text: string): Token[] {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: SegmenterConstructor })
    .Segmenter;

  if (!Segmenter) {
    return [];
  }

  const offsetToCodePoint = buildUtf16OffsetToCodePointIndex(text);
  const segmenter = new Segmenter("zh-CN", { granularity: "word" });
  const tokens: Token[] = [];

  for (const segment of segmenter.segment(text)) {
    const start = offsetToCodePoint.get(segment.index);
    const end = offsetToCodePoint.get(segment.index + segment.segment.length);

    if (start === undefined || end === undefined) {
      continue;
    }

    tokens.push({
      kind: getSpanKind(segment.segment),
      text: segment.segment,
      start,
      end,
      isWordLike: Boolean(segment.isWordLike),
    });
  }

  return tokens;
}

export function splitMixedScriptSpans(chars: readonly string[], span: Span): Span[] {
  return [
    ...findChineseSpans(chars.slice(span.start, span.end)).map((inner) => ({
      ...inner,
      start: inner.start + span.start,
      end: inner.end + span.start,
    })),
    ...findLatinSpans(chars.slice(span.start, span.end)).map((inner) => ({
      ...inner,
      start: inner.start + span.start,
      end: inner.end + span.start,
    })),
  ].sort((left, right) => left.start - right.start);
}

export function isHan(value: string): boolean {
  return /^\p{Script=Han}$/u.test(value);
}

export function isAsciiLetter(value: string): boolean {
  return /^[A-Za-z]$/u.test(value);
}

export function isAllHan(value: string): boolean {
  return value.length > 0 && Array.from(value).every(isHan);
}

export function isAsciiWord(value: string): boolean {
  return /^[A-Za-z]+$/u.test(value);
}

function findSpans(
  chars: readonly string[],
  kind: SpanKind,
  predicate: (value: string) => boolean,
): Span[] {
  const spans: Span[] = [];
  let start: number | undefined;

  for (let index = 0; index <= chars.length; index += 1) {
    const char = chars[index];
    const matches = char !== undefined && predicate(char);

    if (matches && start === undefined) {
      start = index;
    }

    if ((!matches || index === chars.length) && start !== undefined) {
      spans.push({
        kind,
        text: chars.slice(start, index).join(""),
        start,
        end: index,
      });
      start = undefined;
    }
  }

  return spans;
}

function buildUtf16OffsetToCodePointIndex(text: string): Map<number, number> {
  const map = new Map<number, number>();
  let utf16Offset = 0;
  let codePointIndex = 0;

  map.set(0, 0);

  for (const char of Array.from(text)) {
    utf16Offset += char.length;
    codePointIndex += 1;
    map.set(utf16Offset, codePointIndex);
  }

  return map;
}

function getSpanKind(text: string): SpanKind {
  if (isAllHan(text)) {
    return "zh";
  }

  if (isAsciiWord(text)) {
    return "latin";
  }

  return "latin";
}
