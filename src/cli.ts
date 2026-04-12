#!/usr/bin/env node
import { Command, CommanderError } from "commander";
import { noisemake } from "./index.js";
import type { Language, NoiseType } from "./options.js";

type CliOptions = {
  frequency?: string;
  seed?: string;
  types?: string;
  languages?: string;
};

async function main(argv: readonly string[]): Promise<number> {
  const program = new Command();

  program
    .name("noisemake")
    .description("Make text less obviously AI-polished with controlled noise.")
    .argument("[text...]", "text to perturb")
    .option(
      "--frequency <n>",
      "average one perturbation per n eligible tokens",
      "200",
    )
    .option("--seed <seed>", "seed for deterministic output")
    .option("--types <list>", "enabled noise types: typo,repeat", "typo,repeat")
    .option("--languages <list>", "enabled languages: zh,en", "zh,en")
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
  const stdinText = await readMaybePipedStdin();
  const hasArgumentText = positional.length > 0;
  const hasStdinText = stdinText.length > 0;

  if (hasArgumentText && hasStdinText) {
    process.stderr.write(
      "error: provide text either as an argument or through stdin, not both\n",
    );
    return 1;
  }

  if (!hasArgumentText && !hasStdinText) {
    process.stderr.write("error: provide text as an argument or through stdin\n");
    return 1;
  }

  try {
    const output = noisemake(hasArgumentText ? positional.join(" ") : stdinText, {
      frequency: parseFrequency(options.frequency),
      seed: options.seed,
      types: parseList<NoiseType>(options.types),
      languages: parseList<Language>(options.languages),
    });

    process.stdout.write(output);
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

main(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
