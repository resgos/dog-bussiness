import { describe, it, expect } from "vitest";
import {
  validateRegistration,
  isPhoneValid,
  isEmailValid,
  emptyReg,
} from "@/lib/onboarding";

describe("isPhoneValid", () => {
  it("accepts a formatted phone with 10+ digits", () => {
    expect(isPhoneValid("+7 (999) 123-45-67")).toBe(true);
  });
  it("rejects too few digits", () => {
    expect(isPhoneValid("12345")).toBe(false);
  });
});

describe("isEmailValid", () => {
  it("accepts a valid email", () => {
    expect(isEmailValid("anya@example.ru")).toBe(true);
  });
  it("rejects garbage", () => {
    expect(isEmailValid("not-an-email")).toBe(false);
  });
});

describe("validateRegistration", () => {
  it("requires name, phone and district in phone mode", () => {
    const e = validateRegistration(emptyReg);
    expect(e.name).toBeTruthy();
    expect(e.phone).toBeTruthy();
    expect(e.district).toBeTruthy();
  });
  it("passes a complete phone registration", () => {
    const e = validateRegistration({
      ...emptyReg,
      name: "Аня",
      phone: "+79991234567",
      district: "khamovniki",
    });
    expect(Object.keys(e)).toHaveLength(0);
  });
  it("checks email and password in email mode", () => {
    const e = validateRegistration({
      ...emptyReg,
      mode: "email",
      name: "Аня",
      district: "sokol",
      email: "bad",
      password: "123",
    });
    expect(e.email).toBeTruthy();
    expect(e.password).toBeTruthy();
  });
});
