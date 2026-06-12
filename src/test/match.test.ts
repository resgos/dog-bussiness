import { describe, it, expect } from "vitest";
import {
  hamming,
  matchScore,
  rankFoundForLost,
  rankLostForFound,
  ONPAGE_MATCH_MIN,
} from "@/lib/match";

describe("hamming distance (perceptual hash)", () => {
  it("identical hashes → 0", () => {
    expect(hamming("deadbeefdeadbeef", "deadbeefdeadbeef")).toBe(0);
  });
  it("all bits differ (0 vs f) → 64", () => {
    expect(hamming("0000000000000000", "ffffffffffffffff")).toBe(64);
  });
  it("single-bit difference → 1", () => {
    expect(hamming("0000000000000000", "0000000000000001")).toBe(1);
  });
  it("missing/uneven hashes → Infinity", () => {
    expect(hamming(null, "abc")).toBe(Infinity);
    expect(hamming("abc", "abcd")).toBe(Infinity);
  });
});

describe("matchScore photo bonus", () => {
  const base = { district: "khamovniki", breed: "корги" };
  it("close photo hash adds a strong bonus", () => {
    const withClose = matchScore(
      { ...base, photoHash: "deadbeefdeadbeef" },
      { ...base, photoHash: "deadbeefdeadbeef" },
    );
    const noPhoto = matchScore(base, base);
    expect(withClose).toBeGreaterThan(noPhoto);
    expect(withClose - noPhoto).toBeGreaterThanOrEqual(18); // +18 или +35
  });
  it("far photo hash adds nothing", () => {
    const far = matchScore(
      { ...base, photoHash: "0000000000000000" },
      { ...base, photoHash: "ffffffffffffffff" },
    );
    expect(far).toBe(matchScore(base, base));
  });
});

describe("rankFoundForLost prioritises photo match", () => {
  it("находка с похожим фото ранжируется выше", () => {
    const lost = { district: "tverskoy", photoHash: "deadbeefdeadbeef" };
    const founds = [
      { id: "no-photo", district: "tverskoy" },
      { id: "photo-match", district: "tverskoy", photoHash: "deadbeefdeadbeef" },
    ];
    const ranked = rankFoundForLost(lost, founds, 1);
    expect(ranked[0].item.id).toBe("photo-match");
  });
});

describe("matchScore — отдельные сигналы и веса", () => {
  it("ноль сигналов → 0", () => {
    expect(matchScore({}, {})).toBe(0);
  });
  it("совпадение района → +40", () => {
    expect(matchScore({ district: "khamovniki" }, { district: "khamovniki" })).toBe(40);
    expect(matchScore({ district: "khamovniki" }, { district: "tverskoy" })).toBe(0);
  });
  it("совпадение породы → +25", () => {
    expect(matchScore({ breed: "корги" }, { breed: "корги" })).toBe(25);
    expect(matchScore({ breed: "корги" }, { breed: "хаски" })).toBe(0);
  });
  it("совпадение окраса → +20", () => {
    expect(matchScore({ color: "рыжий" }, { color: "рыжий" })).toBe(20);
  });
  it("совпадение размера → +10", () => {
    expect(matchScore({ size: "small" }, { size: "small" })).toBe(10);
    expect(matchScore({ size: "small" }, { size: "large" })).toBe(0);
  });
  it("окно времени (находка в пределах −1..21 дн от пропажи) → +10", () => {
    const lostAt = new Date("2026-06-01T12:00:00Z");
    expect(matchScore({ lostAt }, { createdAt: new Date("2026-06-05T12:00:00Z") })).toBe(10);
    expect(matchScore({ lostAt }, { createdAt: new Date("2026-08-01T12:00:00Z") })).toBe(0); // слишком поздно
    expect(matchScore({ lostAt }, { createdAt: new Date("2026-05-20T12:00:00Z") })).toBe(0); // задолго до
  });
  it("сумма сигналов кэпится на 100", () => {
    const a = {
      district: "khamovniki", breed: "корги", color: "рыжий", size: "small",
      photoHash: "deadbeefdeadbeef", lostAt: new Date("2026-06-01"),
    };
    const b = { ...a, createdAt: new Date("2026-06-02") };
    expect(matchScore(a, b)).toBe(100); // 40+25+20+10+35+10 = 140 → 100
  });
});

describe("overlap токенов (через породу)", () => {
  it("регистронезависимо", () => {
    expect(matchScore({ breed: "Корги" }, { breed: "корги" })).toBe(25);
  });
  it("ё нормализуется в е", () => {
    expect(matchScore({ breed: "Сёттер" }, { breed: "сеттер" })).toBe(25);
  });
  it("подстрока засчитывается", () => {
    expect(matchScore({ breed: "лабрадор" }, { breed: "лабрадор-ретривер" })).toBe(25);
  });
  it("стоп-слова не дают совпадения", () => {
    expect(matchScore({ breed: "средний" }, { breed: "средний" })).toBe(0);
  });
  it("слишком короткие токены (<4 симв) игнорируются", () => {
    expect(matchScore({ breed: "пес" }, { breed: "пес" })).toBe(0);
  });
});

describe("ранжирование и порог", () => {
  const lost = { district: "khamovniki", breed: "корги" }; // совпадение → 65

  it("rankFoundForLost фильтрует по порогу и сортирует по убыванию", () => {
    const founds = [
      { id: "weak", district: "khamovniki" }, // 40
      { id: "strong", district: "khamovniki", breed: "корги" }, // 65
      { id: "none", district: "tverskoy" }, // 0
    ];
    const ranked = rankFoundForLost(lost, founds, 40);
    expect(ranked.map((r) => r.item.id)).toEqual(["strong", "weak"]);
    expect(ranked.every((r) => r.score >= 40)).toBe(true);
  });
  it("порог по умолчанию = 40 (только окрас = 20 → отсев)", () => {
    expect(rankFoundForLost({ color: "рыжий" }, [{ id: "c", color: "рыжий" }])).toHaveLength(0);
  });
  it("ONPAGE_MATCH_MIN (25) пропускает окрас+размер (30)", () => {
    const founds = [{ id: "cs", color: "рыжий", size: "small" }]; // 30 ≥ 25
    expect(
      rankFoundForLost({ color: "рыжий", size: "small" }, founds, ONPAGE_MATCH_MIN),
    ).toHaveLength(1);
  });
  it("rankLostForFound — симметричное обратное направление", () => {
    const found = { district: "khamovniki", breed: "корги" };
    const losts = [
      { id: "match", district: "khamovniki", breed: "корги" }, // 65
      { id: "miss", district: "tverskoy", breed: "хаски" }, // 0
    ];
    expect(rankLostForFound(found, losts, 40).map((r) => r.item.id)).toEqual(["match"]);
  });
});
