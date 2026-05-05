import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { needsNpmExecTtyLineBreak } from "../src/cli.js";

const CLI = "dist/cli.js";

describe("CLI dist output", () => {
  it("writes only transformed argument text to stdout", () => {
    const result = runCli([
      "这个方案需要稳定 stable",
      "--frequency",
      "1",
      "--seed",
      "cli",
      "--types",
      "typo",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim()).not.toBe("这个方案需要稳定 stable");
  });

  it("reads stdin and preserves trailing newline", () => {
    const result = runCli(["--frequency", "1000", "--seed", "stdin"], "短文本\n");

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("短文本\n");
  });

  it("reads input from --file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "input.txt");

    writeFileSync(inputPath, "短文本\n", "utf8");

    const result = runCli([
      "--file",
      inputPath,
      "--frequency",
      "1000",
      "--seed",
      "file",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("短文本\n");
  });

  it("writes output to --out instead of stdout", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "input.txt");
    const outputPath = join(tempDir, "nested", "output.txt");

    writeFileSync(inputPath, "短文本\n", "utf8");

    const result = runCli([
      "--file",
      inputPath,
      "--out",
      outputPath,
      "--frequency",
      "1000",
      "--seed",
      "out",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("");
    expect(readFileSync(outputPath, "utf8")).toBe("短文本\n");
  });

  it("reports a missing --file path as an error", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "missing.txt");

    const result = runCli(["--file", inputPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`cannot read input file ${inputPath}`);
  });

  it("reports an invalid --out target as an error", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "input.txt");
    const outputPath = tempDir;

    writeFileSync(inputPath, "短文本\n", "utf8");

    const result = runCli([
      "--file",
      inputPath,
      "--out",
      outputPath,
      "--frequency",
      "1000",
      "--seed",
      "out-error",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`cannot write output file ${outputPath}`);
  });

  it("rejects both argument and stdin input", () => {
    const result = runCli(["文本"], "stdin 文本");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not multiple inputs");
  });

  it("rejects mixing --file with other input sources", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "input.txt");

    writeFileSync(inputPath, "文件文本", "utf8");

    const result = runCli(["文本", "--file", inputPath]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--file");
  });

  it("rejects mixing stdin with --file", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-cli-"));
    const inputPath = join(tempDir, "input.txt");

    writeFileSync(inputPath, "文件文本", "utf8");

    const result = runCli(["--file", inputPath], "stdin 文本");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("not multiple inputs");
  });

  it("rejects invalid options", () => {
    const result = runCli(["文本", "--types", "filler"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("types must contain only");
  });

  it("shows --file and --out in help text", () => {
    const result = runCli(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: noisemake [options] [text...]");
    expect(result.stdout).toContain("--file <path>");
    expect(result.stdout).toContain("--out <path>");
    expect(result.stdout).toContain("typo,repeat,spacing,punct,swap");
    expect(result.stdout).toContain("-h, --help");
    expect(result.stdout).toContain("Use exactly one input source");
    expect(result.stdout).toContain('noisemake "text" --seed 42');
  });

  it("supports -h as a help alias", () => {
    const result = runCli(["-h"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: noisemake [options] [text...]");
    expect(result.stdout).toContain("-h, --help");
  });

  it("runs when invoked through an installed-package bin symlink", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "noisemake-bin-"));
    const binPath = join(tempDir, "noisemake");

    symlinkSync(resolve(CLI), binPath);

    const result = spawnSync(binPath, ["短文本", "--frequency", "1000"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("短文本");
  });

  it("keeps interactive npx output visible without changing stdout bytes", () => {
    const env = {
      npm_command: "exec",
      npm_execpath: "/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js",
    };

    expect(
      needsNpmExecTtyLineBreak({
        output: "这是一段测试文本",
        stdoutIsTTY: true,
        stderrIsTTY: true,
        env,
      }),
    ).toBe(true);

    expect(
      needsNpmExecTtyLineBreak({
        output: "这是一段测试文本\n",
        stdoutIsTTY: true,
        stderrIsTTY: true,
        env,
      }),
    ).toBe(false);

    expect(
      needsNpmExecTtyLineBreak({
        output: "这是一段测试文本",
        stdoutIsTTY: false,
        stderrIsTTY: true,
        env,
      }),
    ).toBe(false);
  });
});

function runCli(args: readonly string[], input?: string) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    input,
  });
}
