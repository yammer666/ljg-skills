import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildWhiteboardSourceInventory } from "./prepare-whiteboard-source";

const scriptPath = join(import.meta.dir, "prepare-whiteboard-source.ts");

function sha256Text(value: string): string {
  return new Bun.CryptoHasher("sha256").update(value).digest("hex");
}

async function runScript(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const process = Bun.spawn(["bun", scriptPath, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  return { exitCode, stdout, stderr };
}

describe("whiteboard source inventory", () => {
  test("accounts for every non-empty source paragraph in order", () => {
    const source = "第一段提出问题。\n\n第二段给出前提。\n\n\n第三段写出边界。\n";
    const inventory = buildWhiteboardSourceInventory(new TextEncoder().encode(source));
    expect(inventory.section_count).toBe(3);
    expect(inventory.sections.map(section => section.id)).toEqual(["src-01", "src-02", "src-03"]);
    expect(inventory.sections.map(section => section.text)).toEqual([
      "第一段提出问题。",
      "第二段给出前提。",
      "第三段写出边界。",
    ]);
  });

  test("binds both the exact source bytes and every section text to SHA-256", () => {
    const bytes = new TextEncoder().encode("甲。\r\n\r\n乙。\r\n");
    const inventory = buildWhiteboardSourceInventory(bytes);
    expect(inventory.source_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(inventory.sections.every(section => /^[a-f0-9]{64}$/.test(section.text_sha256))).toBe(true);
    expect(new Set(inventory.sections.map(section => section.text_sha256)).size).toBe(2);
  });

  test("rejects a source without readable paragraphs", () => {
    expect(() => buildWhiteboardSourceInventory(new TextEncoder().encode(" \n\n\t"))).toThrow("no readable paragraphs");
  });
});

describe("whiteboard source inventory CLI", () => {
  test("writes a new inventory and preserves the supported pass result", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-fresh-"));
    try {
      const source = join(dir, "nested", "source.txt");
      const output = join(dir, "nested", "inventory.json");
      await Bun.write(source, "第一段。\n\n第二段。\n");
      const result = await runScript([source, output]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('"status": "pass"');
      const inventory = await Bun.file(output).json();
      expect(inventory.section_count).toBe(2);
      expect(inventory.sections.map((section: { text: string }) => section.text)).toEqual(["第一段。", "第二段。"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("missing arguments exit nonzero and do not invent an output path", async () => {
    const result = await runScript([]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Usage:");
  });

  test("missing source exits nonzero and does not create the inventory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-missing-"));
    try {
      const output = join(dir, "inventory.json");
      const result = await runScript([join(dir, "absent.txt"), output]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("does not exist");
      expect(await Bun.file(output).exists()).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("a source without readable paragraphs does not create the inventory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-empty-"));
    try {
      const source = join(dir, "source.txt");
      const output = join(dir, "inventory.json");
      await Bun.write(source, " \n\n\t");
      const result = await runScript([source, output]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("no readable paragraphs");
      expect(await Bun.file(output).exists()).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("refuses to overwrite an existing inventory and keeps the sentinel bytes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-sentinel-"));
    try {
      const source = join(dir, "source.txt");
      const output = join(dir, "inventory.json");
      const sentinel = "SENTINEL-DO-NOT-CLOBBER\n";
      await Bun.write(source, "第一段。\n\n第二段。\n");
      await Bun.write(output, sentinel);
      const before = sha256Text(sentinel);
      const result = await runScript([source, output]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("Refusing to overwrite existing output");
      const after = await Bun.file(output).text();
      expect(after).toBe(sentinel);
      expect(sha256Text(after)).toBe(before);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("does not follow a symlink to overwrite the sentinel target", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-link-"));
    try {
      const source = join(dir, "source.txt");
      const target = join(dir, "sentinel.json");
      const output = join(dir, "inventory.json");
      const sentinel = "SENTINEL-THROUGH-LINK\n";
      await Bun.write(source, "甲。\n\n乙。\n");
      await Bun.write(target, sentinel);
      await symlink(target, output);
      const result = await runScript([source, output]);
      expect(result.exitCode).not.toBe(0);
      expect(await Bun.file(target).text()).toBe(sentinel);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("concurrent writers leave exactly one complete inventory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ljg-whiteboard-race-"));
    try {
      const source = join(dir, "source.txt");
      const output = join(dir, "inventory.json");
      await Bun.write(source, "甲。\n\n乙。\n");
      const results = await Promise.all(Array.from({ length: 8 }, () => runScript([source, output])));
      expect(results.filter((result) => result.exitCode === 0)).toHaveLength(1);
      expect(results.filter((result) => result.exitCode !== 0).every((result) => result.stderr.includes("Refusing to overwrite existing output"))).toBe(true);
      const inventory = await Bun.file(output).json();
      expect(inventory.section_count).toBe(2);
      expect(inventory.sections.map((section: { text: string }) => section.text)).toEqual(["甲。", "乙。"]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
