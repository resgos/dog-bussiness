import { describe, it, expect } from "vitest";
import { primaryNav, profileNav, allNav, type NavItem } from "@/lib/nav";

function allHrefs(items: NavItem[]): string[] {
  return items.flatMap((i) => [i.href, ...(i.children?.map((c) => c.href) ?? [])]);
}

describe("navigation map", () => {
  it("every href is an absolute path", () => {
    for (const href of allHrefs([...allNav, ...profileNav])) {
      expect(href.startsWith("/")).toBe(true);
    }
  });
  it("primary nav hrefs are unique", () => {
    const hrefs = primaryNav.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
  it("includes the key sections from the ТЗ sitemap", () => {
    const hrefs = primaryNav.map((i) => i.href);
    expect(hrefs).toContain("/map");
    expect(hrefs).toContain("/feed");
    expect(hrefs).toContain("/shop");
  });
});
