import { describe, expect, it } from "vitest";
import {
  baseName,
  copyName,
  isSameOrInside,
  joinPath,
  parentOf,
  rebasePath,
  validateName,
} from "@/components/sandbox/FileTree/paths";

const entries = [
  { name: "src", isDir: true },
  { name: "index.ts", isDir: false },
  { name: ".env", isDir: false },
];

describe("path helpers", () => {
  it("joins without a leading slash at the root", () => {
    expect(joinPath("", "a.ts")).toBe("a.ts");
    expect(joinPath("src/lib", "a.ts")).toBe("src/lib/a.ts");
  });

  it("splits parent and base name", () => {
    expect(parentOf("a.ts")).toBe("");
    expect(parentOf("src/lib/a.ts")).toBe("src/lib");
    expect(baseName("src/lib/a.ts")).toBe("a.ts");
    expect(baseName("a.ts")).toBe("a.ts");
  });

  it("treats only real descendants as inside", () => {
    expect(isSameOrInside("src/lib/a.ts", "src")).toBe(true);
    expect(isSameOrInside("src", "src")).toBe(true);
    expect(isSameOrInside("src-old/a.ts", "src")).toBe(false);
    expect(isSameOrInside("anything", "")).toBe(true);
  });

  it("rebases a path after its folder moves", () => {
    expect(rebasePath("src/lib/a.ts", "src", "app")).toBe("app/lib/a.ts");
    expect(rebasePath("src", "src", "app")).toBe("app");
  });
});

describe("validateName", () => {
  const create = (name: string) =>
    validateName(name, { siblings: entries, allowNested: true });
  const rename = (name: string, current = "index.ts") =>
    validateName(name, { siblings: entries, allowNested: false, current });

  it("accepts ordinary and nested names", () => {
    expect(create("app.ts")).toBeNull();
    expect(create("  app.ts  ")).toBeNull();
    expect(create("lib/util.ts")).toBeNull();
    // Into a folder that already exists.
    expect(create("src/new.ts")).toBeNull();
  });

  it("refuses an existing name, which the runner would truncate or replace", () => {
    expect(create("index.ts")).toMatch(/already exists/);
    expect(create("src")).toMatch(/already exists/);
    // A path through an existing *file* isn't a folder.
    expect(create("index.ts/x")).toMatch(/already exists/);
    expect(rename(".env")).toMatch(/already exists/);
  });

  it("allows keeping the current name on rename", () => {
    expect(rename("index.ts")).toBeNull();
  });

  it("refuses empty, traversal and slash tricks", () => {
    expect(create("   ")).toMatch(/Enter a name/);
    expect(create("../escape.ts")).toMatch(/\. or \.\./);
    expect(create("a//b.ts")).toMatch(/\/\//);
    expect(create("/abs.ts")).toMatch(/start or end/);
    expect(create("dir/")).toMatch(/start or end/);
    expect(create("a\\b")).toMatch(/\\/);
    expect(rename("moved/index.ts")).toMatch(/plain name/);
    expect(create("x".repeat(256))).toMatch(/too long/);
  });
});

describe("copyName", () => {
  it("keeps the name when it is free", () => {
    expect(copyName("app.ts", false, new Set(["other.ts"]))).toBe("app.ts");
  });

  it("adds copy before the extension, then numbers", () => {
    expect(copyName("app.ts", false, new Set(["app.ts"]))).toBe("app copy.ts");
    expect(
      copyName("app.ts", false, new Set(["app.ts", "app copy.ts"])),
    ).toBe("app copy 2.ts");
  });

  it("treats dotfiles and folders as having no extension", () => {
    expect(copyName(".env", false, new Set([".env"]))).toBe(".env copy");
    expect(copyName("v1.2", true, new Set(["v1.2"]))).toBe("v1.2 copy");
  });
});
