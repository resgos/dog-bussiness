import { describe, it, expect } from "vitest";
import {
  districts,
  pilotDistricts,
  districtsByOkrug,
  findDistrict,
} from "@/lib/districts";

describe("districts dataset", () => {
  it("has at least two pilot districts", () => {
    expect(pilotDistricts.length).toBeGreaterThanOrEqual(2);
  });
  it("has unique ids", () => {
    const ids = districts.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("groups by okrug with non-empty ЦАО", () => {
    const grouped = districtsByOkrug();
    expect(Object.keys(grouped).length).toBeGreaterThan(1);
    expect(grouped["ЦАО"].length).toBeGreaterThan(0);
  });
  it("finds a district by id", () => {
    expect(findDistrict("khamovniki")?.name).toBe("Хамовники");
    expect(findDistrict("does-not-exist")).toBeUndefined();
  });
});
