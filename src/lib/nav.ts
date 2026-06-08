/** Карта сайта «Лапки помощи» — единый источник навигации. */
export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

/** Основная навигация в шапке. */
export const primaryNav: NavItem[] = [
  { label: "Карта", href: "/map" },
  {
    label: "Лента",
    href: "/feed",
    children: [
      { label: "Потерялись", href: "/feed/lost" },
      { label: "Найдены", href: "/feed/found" },
      { label: "Я нашёл собаку", href: "/found/new" },
    ],
  },
  {
    label: "Комьюнити",
    href: "/community",
    children: [
      { label: "Районные ленты", href: "/community/districts" },
      { label: "Рейтинг волонтёров", href: "/community/volunteers" },
      { label: "Приюты — забрать друга", href: "/adoption" },
      { label: "Сервисы рядом", href: "/services" },
    ],
  },
  {
    label: "Магазин",
    href: "/shop",
    children: [
      { label: "Адресники", href: "/shop/addressniki" },
      { label: "Браслеты и аксессуары", href: "/shop/bracelets" },
      { label: "Корзина", href: "/shop/cart" },
    ],
  },
  { label: "О проекте", href: "/about" },
];

/** Второстепенные разделы (футер, мобильное меню). */
export const secondaryNav: NavItem[] = [
  { label: "Партнёрам", href: "/partners" },
  { label: "Блог", href: "/blog" },
];

/** Навигация личного кабинета. */
export const profileNav: NavItem[] = [
  { label: "Мои питомцы", href: "/profile/pets" },
  { label: "Добавить питомца", href: "/profile/pets/add" },
  { label: "Мои поиски", href: "/profile/my-searches" },
  { label: "Пригласить соседа", href: "/profile/invite" },
  { label: "Моя стая", href: "/profile/my-pack" },
  { label: "Мои заказы", href: "/profile/orders" },
  { label: "Достижения", href: "/profile/achievements" },
  { label: "Настройки", href: "/profile/settings" },
];

/** Полный плоский список маршрутов — удобно для генерации заглушек/карты. */
export const allNav: NavItem[] = [...primaryNav, ...secondaryNav];
