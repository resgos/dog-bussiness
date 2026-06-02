import { cn } from "@/lib/cn";

const ORANGE = "#E89B5E";
const ORANGE_DARK = "#D7894C";
const CREAM = "#FFF6EC";
const PINK = "#F2B4C4";
const PINK_DARK = "#E07F9C";
const EAR_INNER = "#F4C3CE";
const TEAL = "#2E8B86";
const DARK = "#3B302C";

function Flower({ x, y }: { x: number; y: number }) {
  return (
    <g fill={PINK_DARK}>
      <circle cx={x} cy={y - 4} r="2.1" />
      <circle cx={x + 4} cy={y - 1} r="2.1" />
      <circle cx={x + 2.5} cy={y + 4} r="2.1" />
      <circle cx={x - 2.5} cy={y + 4} r="2.1" />
      <circle cx={x - 4} cy={y - 1} r="2.1" />
      <circle cx={x} cy={y} r="1.5" fill={PINK} />
    </g>
  );
}

/**
 * Шуня — анимированный SVG-маскот. Части реально двигаются (моргает, шевелит
 * ушами, виляет хвостом, дышит; машет лапой при waving) — анимация на CSS.
 */
export function ShunyaAnimated({
  size = 96,
  waving = false,
  className,
}: {
  size?: number;
  waving?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 210"
      width={size}
      height={size}
      className={cn("shunya-anim", waving && "is-waving", className)}
      role="img"
      aria-label="Шуня"
    >
      {/* Хвостик-нуб (виляет) */}
      <g className="s-tail">
        <ellipse cx="150" cy="150" rx="15" ry="13" fill={ORANGE} />
        <ellipse cx="151" cy="146" rx="9" ry="7" fill={CREAM} opacity="0.55" />
      </g>

      {/* Тело в пижаме (дышит) */}
      <g className="s-breathe">
        <path
          d="M58 198 Q42 150 70 126 Q100 108 130 126 Q158 150 142 198 Z"
          fill={PINK}
        />
        <rect x="77" y="166" width="17" height="36" rx="8.5" fill={PINK} />
        <rect x="106" y="166" width="17" height="36" rx="8.5" fill={PINK} />
        <ellipse cx="85" cy="201" rx="11" ry="8" fill={CREAM} />
        <ellipse cx="114" cy="201" rx="11" ry="8" fill={CREAM} />
        <Flower x={80} y={150} />
        <Flower x={118} y={150} />
        <Flower x={99} y={172} />
        <Flower x={128} y={178} />
        <Flower x={70} y={178} />
      </g>

      {/* Ошейник + адресник */}
      <rect x="66" y="116" width="68" height="11" rx="5.5" fill={TEAL} />
      <rect
        x="86"
        y="124"
        width="29"
        height="15"
        rx="4"
        fill="#FBEFE0"
        stroke="#E6D3C2"
      />
      <text
        x="100.5"
        y="135"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#6B5B53"
        fontFamily="var(--font-sans), sans-serif"
      >
        Шуня
      </text>

      {/* Машущая лапа (анимируется при наведении) */}
      <g className="s-paw">
        <rect x="150" y="96" width="13" height="28" rx="6.5" fill={PINK} />
        <ellipse cx="156" cy="96" rx="10" ry="9" fill={CREAM} />
      </g>

      {/* Голова */}
      <g>
        <ellipse cx="100" cy="74" rx="50" ry="46" fill={CREAM} />

        {/* Рыжая «шапочка» и уши */}
        <path
          d="M54 64 Q56 20 100 22 Q144 20 146 64 Q122 42 100 44 Q78 42 54 64 Z"
          fill={ORANGE}
        />
        <path d="M92 30 Q100 64 108 30 Q104 25 100 25 Q96 25 92 30 Z" fill={CREAM} />

        <g className="s-ear-l">
          <path d="M58 64 Q40 14 72 30 Q80 46 78 66 Z" fill={ORANGE} />
          <path d="M63 58 Q54 28 70 38 Q74 48 73 60 Z" fill={EAR_INNER} />
        </g>
        <g className="s-ear-r">
          <path d="M142 64 Q160 14 128 30 Q120 46 122 66 Z" fill={ORANGE} />
          <path d="M137 58 Q146 28 130 38 Q126 48 127 60 Z" fill={EAR_INNER} />
        </g>

        {/* Брови */}
        <path
          d="M73 64 Q82 59 91 64"
          stroke={ORANGE_DARK}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M109 64 Q118 59 127 64"
          stroke={ORANGE_DARK}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Глаза + веки для моргания */}
        <ellipse cx="84" cy="81" rx="8.5" ry="10.5" fill={DARK} />
        <circle cx="87" cy="77.5" r="2.4" fill="#fff" />
        <ellipse cx="116" cy="81" rx="8.5" ry="10.5" fill={DARK} />
        <circle cx="119" cy="77.5" r="2.4" fill="#fff" />
        <ellipse className="s-eyelid" cx="84" cy="80" rx="9.6" ry="11.5" fill={CREAM} />
        <ellipse className="s-eyelid" cx="116" cy="80" rx="9.6" ry="11.5" fill={CREAM} />

        {/* Щёчки */}
        <ellipse cx="69" cy="93" rx="6" ry="4" fill={PINK} opacity="0.6" />
        <ellipse cx="131" cy="93" rx="6" ry="4" fill={PINK} opacity="0.6" />

        {/* Нос и улыбка */}
        <ellipse cx="100" cy="92" rx="7" ry="5.5" fill={DARK} />
        <ellipse cx="98" cy="90" rx="2" ry="1.3" fill="#fff" opacity="0.5" />
        <path
          d="M100 97 Q100 104 91 106"
          stroke={DARK}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M100 97 Q100 104 109 106"
          stroke={DARK}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M96 105 Q100 111 104 105 Z" fill="#E98AA0" />
      </g>
    </svg>
  );
}
