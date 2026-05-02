export type Segment = {
  text: string;
  changed: boolean;
};

const EXACT_DIFF_PRODUCT_LIMIT = 250_000;
const SYNC_LOOKAHEAD = 80;
const MIN_SYNC_RUN = 3;
const MAX_SYNC_RUN = 32;

export function diffOutput(input: string, output: string): Segment[] {
  if (input === output) {
    return [{ text: output, changed: false }];
  }

  const inputChars = Array.from(input);
  const outputChars = Array.from(output);
  let prefix = 0;
  while (
    prefix < inputChars.length &&
    prefix < outputChars.length &&
    inputChars[prefix] === outputChars[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix + prefix < inputChars.length &&
    suffix + prefix < outputChars.length &&
    inputChars[inputChars.length - 1 - suffix] === outputChars[outputChars.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const inputMiddle = inputChars.slice(prefix, inputChars.length - suffix);
  const outputMiddle = outputChars.slice(prefix, outputChars.length - suffix);
  const segments: Segment[] = [];

  if (prefix > 0) {
    segments.push({ text: outputChars.slice(0, prefix).join(""), changed: false });
  }

  if (inputMiddle.length * outputMiddle.length > EXACT_DIFF_PRODUCT_LIMIT) {
    segments.push(...diffMiddleByLocalSync(inputMiddle, outputMiddle));
  } else {
    segments.push(...diffMiddleByLcs(inputMiddle, outputMiddle));
  }

  if (suffix > 0) {
    segments.push({
      text: outputChars.slice(outputChars.length - suffix).join(""),
      changed: false,
    });
  }

  return mergeSegments(segments.filter((segment) => segment.text.length > 0));
}

function diffMiddleByLocalSync(inputChars: string[], outputChars: string[]): Segment[] {
  const segments: Segment[] = [];
  let inputIndex = 0;
  let outputIndex = 0;

  while (inputIndex < inputChars.length && outputIndex < outputChars.length) {
    if (inputChars[inputIndex] === outputChars[outputIndex]) {
      segments.push({ text: outputChars[outputIndex]!, changed: false });
      inputIndex += 1;
      outputIndex += 1;
      continue;
    }

    const sync = findLocalSync(inputChars, outputChars, inputIndex, outputIndex);
    if (sync) {
      const changedText = outputChars.slice(outputIndex, sync.outputIndex).join("");
      if (changedText) {
        segments.push({ text: changedText, changed: true });
      }
      inputIndex = sync.inputIndex;
      outputIndex = sync.outputIndex;
      continue;
    }

    segments.push({ text: outputChars[outputIndex]!, changed: true });
    inputIndex += 1;
    outputIndex += 1;
  }

  if (outputIndex < outputChars.length) {
    segments.push({ text: outputChars.slice(outputIndex).join(""), changed: true });
  }

  return mergeSegments(segments);
}

function findLocalSync(
  inputChars: string[],
  outputChars: string[],
  inputIndex: number,
  outputIndex: number,
): { inputIndex: number; outputIndex: number } | null {
  const maxInputOffset = Math.min(SYNC_LOOKAHEAD, inputChars.length - inputIndex - 1);
  const maxOutputOffset = Math.min(SYNC_LOOKAHEAD, outputChars.length - outputIndex - 1);
  let best: { inputIndex: number; outputIndex: number; distance: number; run: number } | null =
    null;

  for (let inputOffset = 0; inputOffset <= maxInputOffset; inputOffset += 1) {
    for (let outputOffset = 0; outputOffset <= maxOutputOffset; outputOffset += 1) {
      if (inputOffset === 0 && outputOffset === 0) {
        continue;
      }

      const nextInputIndex = inputIndex + inputOffset;
      const nextOutputIndex = outputIndex + outputOffset;
      if (inputChars[nextInputIndex] !== outputChars[nextOutputIndex]) {
        continue;
      }

      const run = countCommonRun(inputChars, outputChars, nextInputIndex, nextOutputIndex);
      const remainingRun = Math.min(
        MIN_SYNC_RUN,
        inputChars.length - nextInputIndex,
        outputChars.length - nextOutputIndex,
      );
      if (run < remainingRun) {
        continue;
      }

      const distance = inputOffset + outputOffset;
      if (!best || distance < best.distance || (distance === best.distance && run > best.run)) {
        best = {
          inputIndex: nextInputIndex,
          outputIndex: nextOutputIndex,
          distance,
          run,
        };
      }
    }
  }

  return best ? { inputIndex: best.inputIndex, outputIndex: best.outputIndex } : null;
}

function countCommonRun(
  inputChars: string[],
  outputChars: string[],
  inputIndex: number,
  outputIndex: number,
): number {
  let run = 0;
  while (
    run < MAX_SYNC_RUN &&
    inputIndex + run < inputChars.length &&
    outputIndex + run < outputChars.length &&
    inputChars[inputIndex + run] === outputChars[outputIndex + run]
  ) {
    run += 1;
  }

  return run;
}

function diffMiddleByLcs(inputChars: string[], outputChars: string[]): Segment[] {
  const rows = inputChars.length + 1;
  const cols = outputChars.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = inputChars.length - 1; i >= 0; i -= 1) {
    for (let j = outputChars.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        inputChars[i] === outputChars[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const unchanged = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < inputChars.length && j < outputChars.length) {
    if (inputChars[i] === outputChars[j]) {
      unchanged.add(j);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return mergeSegments(
    outputChars.map((char, index) => ({
      text: char,
      changed: !unchanged.has(index),
    })),
  );
}

function mergeSegments(segments: Segment[]): Segment[] {
  const merged: Segment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && previous.changed === segment.changed) {
      previous.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}
