import { describe, it, expect } from "vitest";
import { hasProfanity, censorProfanity } from "@/lib/profanity";

describe("hasProfanity — ловит брань и обходы", () => {
  const dirty = [
    "пиздец",
    "Какой ПИЗДЕЦ творится",
    "п.и.з.д.е.ц",
    "пи3дец",
    "нахуй",
    "охуеть",
    "схуяли",
    "ебать",
    "заебало",
    "долбоёб",
    "блядь",
    "бля, ну что такое",
    "мудак какой-то",
    "пидор",
    "гандон",
    "сууууука залупа",
  ];
  for (const t of dirty) {
    it(`грязно: «${t}»`, () => expect(hasProfanity(t)).toBe(true));
  }

  const clean = [
    "употреблять воду",
    "оскорблять нельзя",
    "требуется помощь",
    "обляпался кашей",
    "хлеб и небо",
    "храбрая собака в Хамовниках",
    "она хорошая, ухоженная",
    "психует на салюты",
    "команда «лежать»",
    "себастьян и ребус",
    "подушка и подъезд",
    "хуже не стало", // «хуже» — не мат
  ];
  for (const t of clean) {
    it(`чисто: «${t}»`, () => expect(hasProfanity(t)).toBe(false));
  }

  it("пустое/null — чисто", () => {
    expect(hasProfanity("")).toBe(false);
    expect(hasProfanity(null)).toBe(false);
    expect(hasProfanity(undefined)).toBe(false);
  });
});

describe("censorProfanity — цензурит, не трогая чистое", () => {
  it("заменяет слово звёздочками с первой буквой", () => {
    expect(censorProfanity("какой пиздец")).toBe("какой п*****");
  });
  it("чистый текст не меняется", () => {
    const s = "Добрая собака, требуется передержка в Хамовниках";
    expect(censorProfanity(s)).toBe(s);
  });
  it("маскированное тоже цензурится", () => {
    expect(censorProfanity("пи3дец")).toBe("п*****");
    expect(censorProfanity("п.и.з.д.е.ц")).toMatch(/^п\*+$/);
  });
  it("null проходит насквозь", () => {
    expect(censorProfanity(null)).toBeNull();
  });
});
