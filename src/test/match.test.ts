import { describe, it, expect } from "vitest";
import { hamming, matchScore, rankFoundForLost } from "@/lib/match";

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
