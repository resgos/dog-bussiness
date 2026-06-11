import { describe, it, expect } from "vitest";
import { rescueRate } from "@/lib/pulse";

describe("rescueRate — доля «возвращений домой»", () => {
  it("нет данных → 0 (не делим на ноль)", () => {
    expect(rescueRate(0, 0)).toBe(0);
  });
  it("только истории, нет активных → 100%", () => {
    expect(rescueRate(5, 0)).toBe(100);
  });
  it("поровну дома и в розыске → 50%", () => {
    expect(rescueRate(5, 5)).toBe(50);
  });
  it("округляет до целого", () => {
    expect(rescueRate(1, 2)).toBe(33);
    expect(rescueRate(2, 1)).toBe(67);
  });
  it("результат всегда в диапазоне 0..100", () => {
    expect(rescueRate(0, 7)).toBe(0);
    expect(rescueRate(7, 0)).toBe(100);
  });
});
