/** Данные и валидация мастера добавления питомца (ТЗ 4.2 / экраны 1–6). */
import { isPhoneValid } from "./onboarding";

export type PetData = {
  photo: string | null;
  name: string;
  breed: string;
  sex: "male" | "female" | "";
  age: string;
  size: string;
  color: string;
  marks: string[];
  chip: string;
  marksText: string;
  district: string;
  address: string;
  walkSpots: string[];
  temperament: string[];
  ownerPhone: string;
  extraPhone: string;
  telegram: string;
  showPhone: boolean;
  wantPush: boolean;
};

export const emptyPet: PetData = {
  photo: null,
  name: "",
  breed: "",
  sex: "",
  age: "",
  size: "",
  color: "",
  marks: [],
  chip: "",
  marksText: "",
  district: "",
  address: "",
  walkSpots: [],
  temperament: [],
  ownerPhone: "",
  extraPhone: "",
  telegram: "",
  showPhone: false,
  wantPush: true,
};

export const breedOptions = [
  "Метис / не знаю",
  "Лабрадор-ретривер",
  "Золотистый ретривер",
  "Немецкая овчарка",
  "Хаски",
  "Корги",
  "Джек-рассел-терьер",
  "Чихуахуа",
  "Такса",
  "Шпиц",
  "Бигль",
  "Французский бульдог",
  "Йоркширский терьер",
  "Бордер-колли",
  "Мопс",
  "Самоед",
  "Доберман",
  "Кокер-спаниель",
  "Дворняжка",
];

export const ageOptions = [
  { value: "puppy", label: "Щенок" },
  { value: "young", label: "Молодой" },
  { value: "adult", label: "Взрослый" },
  { value: "senior", label: "Пожилой" },
];

export const sizeOptions = [
  { value: "small", label: "Маленький (до 10 кг)" },
  { value: "medium", label: "Средний (10–25 кг)" },
  { value: "large", label: "Крупный (25+ кг)" },
];

/** Теги особых примет (ТЗ экран 3). */
export const markTags = [
  "Купированный хвост / уши",
  "Шрам / рана",
  "Хромота",
  "Разные глаза (гетерохромия)",
  "Пятно на морде / теле",
  "Отсутствие лапы / пальца",
  "Слепой / глухой",
  "Клеймо / чип",
];

/** Теги характера и поведения (ТЗ экран 5). */
export const temperamentTags = [
  "Дружелюбный к людям",
  "Осторожный",
  "Пугливый",
  "Может укусить",
  "Ладит с собаками",
  "Не ладит с собаками",
  "Избирательно с собаками",
  "Подходит на подзыв",
  "Убегает от незнакомых",
  "Реагирует на кличку",
  "Боится салютов / громких звуков",
];

export const STEPS = [
  { key: "photo", title: "Фото питомца", shunya: "Ну покажи, покажи! Кто этот красавчик?" },
  { key: "basic", title: "Основная информация", shunya: "Так, записываю в свой блокнот…" },
  { key: "marks", title: "Особые приметы", shunya: "А что у него особенного? Шрам? Пятнышко? Один глаз хитрее другого?" },
  { key: "area", title: "Район и маршруты", shunya: "Где вы обычно гуляете? Покажи мне — я запомню!" },
  { key: "temper", title: "Характер и поведение", shunya: "Какой у него характер? Это важно, если его встретит незнакомый человек." },
  { key: "contacts", title: "Контакты", shunya: "Почти готово! Проверь контакты — по ним с тобой свяжутся, если что." },
] as const;

export const MARK_CHIP = "Клеймо / чип";

/** Можно ли перейти со step дальше (обязательные поля по ТЗ). */
export function canProceed(step: number, d: PetData): boolean {
  switch (step) {
    case 0:
      return d.photo !== null; // главное фото обязательно
    case 1:
      return d.name.trim().length > 0; // кличка обязательна
    case 3:
      return d.district !== ""; // район обязателен
    case 5:
      return isPhoneValid(d.ownerPhone); // телефон обязателен
    default:
      return true; // приметы и характер — необязательные
  }
}

/** Процент заполненности профиля (для подсказки «Досье готово»). */
export function completion(d: PetData): number {
  const checks = [
    d.photo !== null,
    d.name.trim().length > 0,
    d.breed !== "",
    d.sex !== "",
    d.age !== "",
    d.size !== "",
    d.color.trim().length > 0,
    d.marks.length > 0 || d.marksText.trim().length > 0,
    d.district !== "",
    d.walkSpots.length > 0,
    d.temperament.length > 0,
    isPhoneValid(d.ownerPhone),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((x) => x !== item)
    : [...list, item];
}
