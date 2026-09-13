import { describe, expect, it } from "vitest";
import { PLANS, SELF_HOST_NOTE, SPEC_ROWS, pricingMarkdown } from "@/lib/pricing";

describe("pricing", () => {
  it("every plan has one spec per spec row", () => {
    for (const plan of PLANS) expect(plan.specs, plan.name).toHaveLength(SPEC_ROWS.length);
  });

  it("markdown table has a row per plan with matching column count", () => {
    const text = pricingMarkdown();
    const tableRows = text.split("\n").filter((line) => line.startsWith("| "));
    expect(tableRows).toHaveLength(PLANS.length + 2);
    const columns = tableRows.map((row) => row.split("|").length);
    expect(new Set(columns).size).toBe(1);
    expect(text).toContain(SELF_HOST_NOTE);
  });
});
