#!/usr/bin/env node
import { Command, CommanderError } from "commander";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { noisemake } from "./index.js";
import type { Language, NoiseType } from "./options.js";

type CliOptions = {
  frequency?: string;
  seed?: string;
  types?: string;
  languages?: string;
  file?: string;
  out?: string;
};

async function main(argv: readonly string[]): Promise<number> {
  const program = new Command();

  program
    .name("noisemake")
    .description("Make text less obviously AI-polished with controlled noise.")
    .argument("[text...]", "text to perturb")
    .option(
      "--frequency <n>",
      "Average one perturbation per n eligible tokens",
      "200",
    )
    .option("--seed <seed>", "Seed for deterministic output")
    .option("--types <list>", "Enabled noise types: typo,repeat", "typo,repeat")
    .option("--languages <list>", "Enabled languages: zh,en", "zh,en")
    .option("--file <path>", "Read input text from a UTF-8 file")
    .option(
      "--out <path>",
      "Write output text to a UTF-8 file, creating parent directories if needed",
    )
    .helpOption("-h, --help", "Show help")
    .addHelpText(
      "after",
      `
Notes:
  Use exactly one input source: positional text, stdin, or --file.
  When --out is set, output is written to the file instead of stdout.

Examples:
  noisemake "text" --seed 42
  echo "text" | noisemake --seed 42
  noisemake --file ./input.txt --out ./output.txt --seed 42`,
    )
    .showHelpAfterError()
    .exitOverride();

  try {
    program.parse(argv, { from: "user" });
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    throw error;
  }

  const positional = program.args;
  const options = program.opts<CliOptions>();

  try {
    const stdinText = await readMaybePipedStdin();
    const hasArgumentText = positional.length > 0;
    const hasStdinText = stdinText.length > 0;
    const hasFileInput = options.file !== undefined;
    const inputSourceCount =
      Number(hasArgumentText) + Number(hasStdinText) + Number(hasFileInput);

    if (inputSourceCount > 1) {
      process.stderr.write(
        "error: provide text either as an argument, through stdin, or with --file, not multiple inputs\n",
      );
      return 1;
    }

    if (inputSourceCount === 0) {
      process.stderr.write(
        "error: provide text as an argument, through stdin, or with --file\n",
      );
      return 1;
    }

    const inputText = hasArgumentText
      ? positional.join(" ")
      : hasStdinText
        ? stdinText
        : await readTextFile(options.file!);

    const output = noisemake(inputText, {
      frequency: parseFrequency(options.frequency),
      seed: options.seed,
      types: parseList<NoiseType>(options.types),
      languages: parseList<Language>(options.languages),
    });

    if (options.out === undefined) {
      process.stdout.write(output);
    } else {
      await writeTextFile(options.out, output);
    }

    return 0;
  } catch (error) {
    process.stderr.write(`error: ${getErrorMessage(error)}\n`);
    return 1;
  }
}

function parseFrequency(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function parseList<T extends string>(value: string | undefined): T[] {
  if (value === undefined) {
    return [];
  }

  return value.split(",").map((item) => item.trim()) as T[];
}

async function readMaybePipedStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readTextFile(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    throw new Error(`cannot read input file ${path}: ${getErrorMessage(error)}`);
  }
}

async function writeTextFile(path: string, text: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, text, "utf8");
  } catch (error) {
    throw new Error(`cannot write output file ${path}: ${getErrorMessage(error)}`);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

main(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
