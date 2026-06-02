/** Районы Москвы для MVP. Пилот — 2–3 района (ТЗ: запуск, затем масштаб). */
export type District = {
  id: string;
  name: string;
  okrug: string;
  /** Пилотный район запуска MVP. */
  pilot?: boolean;
};

export const districts: District[] = [
  // ЦАО
  { id: "arbat", name: "Арбат", okrug: "ЦАО" },
  { id: "basmanny", name: "Басманный", okrug: "ЦАО" },
  { id: "zamoskvorechye", name: "Замоскворечье", okrug: "ЦАО" },
  { id: "krasnoselsky", name: "Красносельский", okrug: "ЦАО" },
  { id: "meshchansky", name: "Мещанский", okrug: "ЦАО" },
  { id: "presnensky", name: "Пресненский", okrug: "ЦАО", pilot: true },
  { id: "tagansky", name: "Таганский", okrug: "ЦАО" },
  { id: "tverskoy", name: "Тверской", okrug: "ЦАО" },
  { id: "khamovniki", name: "Хамовники", okrug: "ЦАО", pilot: true },
  { id: "yakimanka", name: "Якиманка", okrug: "ЦАО", pilot: true },
  // САО
  { id: "aeroport", name: "Аэропорт", okrug: "САО" },
  { id: "sokol", name: "Сокол", okrug: "САО" },
  { id: "khoroshevsky", name: "Хорошёвский", okrug: "САО" },
  // СВАО
  { id: "butyrsky", name: "Бутырский", okrug: "СВАО" },
  { id: "ostankinsky", name: "Останкинский", okrug: "СВАО" },
  { id: "marina-roshcha", name: "Марьина Роща", okrug: "СВАО" },
  // ВАО
  { id: "sokolniki", name: "Сокольники", okrug: "ВАО" },
  { id: "preobrazhenskoe", name: "Преображенское", okrug: "ВАО" },
  { id: "izmailovo", name: "Измайлово", okrug: "ВАО" },
  // ЮАО / ЮЗАО / ЗАО
  { id: "danilovsky", name: "Даниловский", okrug: "ЮАО" },
  { id: "gagarinsky", name: "Гагаринский", okrug: "ЮЗАО" },
  { id: "ramenki", name: "Раменки", okrug: "ЗАО" },
  { id: "dorogomilovo", name: "Дорогомилово", okrug: "ЗАО" },
  { id: "fili-davydkovo", name: "Фили-Давыдково", okrug: "ЗАО" },
];

export const pilotDistricts = districts.filter((d) => d.pilot);

/** Районы, сгруппированные по округу — для <optgroup> в селекторах. */
export function districtsByOkrug(): Record<string, District[]> {
  return districts.reduce<Record<string, District[]>>((acc, d) => {
    (acc[d.okrug] ??= []).push(d);
    return acc;
  }, {});
}

export function findDistrict(id: string): District | undefined {
  return districts.find((d) => d.id === id);
}
