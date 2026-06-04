// Быстрая проверка контраста по WCAG 2.1 для кандидатов токенов.
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const L = (hex) => {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (fg, bg) => {
  const a = L(fg) + 0.05;
  const b = L(bg) + 0.05;
  return (Math.max(a, b) / Math.min(a, b));
};
const WHITE = "#ffffff", CREAM = "#fff9f5", BLUSH = "#fcd9e2";
const pass = (r, large = false) => (r >= (large ? 3 : 4.5) ? "PASS" : "fail");
const row = (label, fg, bg, large = false) => {
  const r = ratio(fg, bg);
  console.log(`${label.padEnd(34)} ${fg} on ${bg} = ${r.toFixed(2)}:1  ${pass(r, large)}${large ? " (large)" : ""}`);
};

console.log("=== ink-soft candidates (normal text, need 4.5) ===");
for (const c of ["#8c8480", "#7d756e", "#787169", "#736b65", "#6f6862"]) row("ink-soft " + c, c, WHITE);
console.log("\n=== petal-deep candidates as link text on white/cream (4.5) + blush chip ===");
for (const c of ["#d9849a", "#c25d79", "#bb5675", "#b85a76", "#b35070"]) { row("petal " + c + " /white", c, WHITE); }
for (const c of ["#bb5675", "#b35070", "#a94768"]) { row("petal " + c + " /blush", c, BLUSH); }
console.log("\n=== status-found-ink candidates (badge text, 4.5) ===");
for (const c of ["#4f9e63", "#46915f", "#418a58", "#3f8456"]) row("found-ink " + c, c, WHITE);
console.log("\n=== status-seen-ink candidates (4.5) ===");
for (const c of ["#3d7cc0", "#3873b5", "#356fb0"]) row("seen-ink " + c, c, WHITE);
console.log("\n=== white text on SOS red (button label is large/bold -> 3) ===");
for (const c of ["#ef6461", "#e8534f", "#e0463f", "#d83f3a"]) row("white on " + c, "#ffffff", c, true);
console.log("\n=== red as text on white (sos-outline label, large -> 3) ===");
for (const c of ["#ef6461", "#e0463f", "#d2453f"]) row("red text " + c, c, WHITE, true);
