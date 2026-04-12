import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

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

  it("rejects both argument and stdin input", () => {
    const result = runCli(["文本"], "stdin 文本");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("either as an argument or through stdin");
  });

  it("rejects invalid options", () => {
    const result = runCli(["文本", "--types", "filler"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("types must contain only");
  });
});

function runCli(args: readonly string[], input?: string) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    input,
  });
}
