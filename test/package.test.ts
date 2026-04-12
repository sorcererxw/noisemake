import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("package dist output", () => {
  it("can be imported from ESM", () => {
    const result = spawnSync(process.execPath, ["test/fixtures/esm-consumer.mjs"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim()).toBe("esm-ok");
  });

  it("can be required from CJS", () => {
    const result = spawnSync(process.execPath, ["test/fixtures/cjs-consumer.cjs"], {
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim()).toBe("cjs-ok");
  });
});
