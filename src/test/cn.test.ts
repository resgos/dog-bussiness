import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });
  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });
  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
