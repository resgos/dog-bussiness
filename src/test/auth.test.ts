import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/auth";

// Хэш пароля (scrypt "salt:hash") + защита входа от timing-перечисления аккаунтов.
describe("password hashing", () => {
  it("roundtrip: верный пароль проходит", () => {
    const h = hashPassword("s3cret-Пароль-🐶");
    expect(verifyPassword("s3cret-Пароль-🐶", h)).toBe(true);
  });

  it("неверный пароль отклоняется", () => {
    const h = hashPassword("right-one");
    expect(verifyPassword("wrong-one", h)).toBe(false);
  });

  it("битый формат хэша → false без исключения", () => {
    expect(verifyPassword("x", "не-соль-без-двоеточия")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("DUMMY_PASSWORD_HASH — выравнивание времени входа", () => {
  it("валидного формата salt:hash (scrypt отработает, не ранний выход)", () => {
    const [salt, hash] = DUMMY_PASSWORD_HASH.split(":");
    expect(salt && salt.length).toBeGreaterThan(0);
    expect(hash && hash.length).toBeGreaterThan(0);
  });

  it("любой пароль против заглушки → false", () => {
    // Вход на несуществующий аккаунт прогоняет scrypt против этой заглушки:
    // время как у реальной проверки, но пароль никогда не совпадёт.
    expect(verifyPassword("anything", DUMMY_PASSWORD_HASH)).toBe(false);
    expect(verifyPassword("", DUMMY_PASSWORD_HASH)).toBe(false);
  });
});
