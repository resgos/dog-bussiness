/** Чистая логика онбординга/регистрации (ТЗ 4.1) — без UI, удобно тестировать. */

export type RegMode = "phone" | "email";

export type RegData = {
  name: string;
  phone: string;
  smsCode: string;
  district: string;
  telegram: string;
  email: string;
  password: string;
  mode: RegMode;
};

export const emptyReg: RegData = {
  name: "",
  phone: "",
  smsCode: "",
  district: "",
  telegram: "",
  email: "",
  password: "",
  mode: "phone",
};

export function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export function isPhoneValid(phone: string): boolean {
  return digits(phone).length >= 10;
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type RegField = "name" | "phone" | "district" | "email" | "password";
export type RegErrors = Partial<Record<RegField, string>>;

/** Проверяет обязательные поля регистрации (ТЗ: имя, телефон, район). */
export function validateRegistration(d: RegData): RegErrors {
  const e: RegErrors = {};
  if (!d.name.trim()) e.name = "Как тебя зовут?";
  if (d.mode === "phone") {
    if (!isPhoneValid(d.phone)) e.phone = "Введи корректный телефон";
  } else {
    if (!isEmailValid(d.email)) e.email = "Введи корректный email";
    if (d.password.length < 6) e.password = "Минимум 6 символов";
  }
  if (!d.district) e.district = "Выбери район проживания";
  return e;
}

export function isRegValid(d: RegData): boolean {
  return Object.keys(validateRegistration(d)).length === 0;
}
