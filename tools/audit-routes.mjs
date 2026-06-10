// Аудит маршрутов: статусы всех страниц (включая динамические — id берём из БД).
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const BASE = "http://localhost:3002";

const pet = await db.pet.findFirst({ select: { id: true } });
const lost = await db.lostReport.findFirst({ select: { id: true } });
const product = await db.product.findFirst({ select: { slug: true } });
const volunteer = await db.user.findFirst({ select: { id: true } });

const routes = [
  "/", "/map", "/feed", "/feed/lost", "/feed/found", "/found", "/found/new",
  "/sos", "/chip", "/guide", "/guide/lost", "/guide/found",
  "/reunited", "/reunited/new",
  "/community", "/community/districts", "/community/volunteers",
  volunteer ? `/community/volunteers/${volunteer.id}` : null,
  "/adoption", "/adoption/new", "/services",
  "/partners", "/partners/new", "/plus",
  "/shop", "/shop/addressniki", "/shop/bracelets", "/shop/cart",
  product ? `/shop/product/${product.slug}` : null,
  "/about", "/blog", "/privacy", "/offer", "/auth",
  "/profile", "/profile/pets", "/profile/pets/add", "/profile/my-searches",
  "/profile/invite", "/profile/my-pack", "/profile/orders",
  "/profile/achievements", "/profile/settings", "/notifications",
  pet ? `/p/${pet.id}` : null,
  lost ? `/poster/${lost.id}` : null,
  "/sitemap.xml", "/robots.txt",
].filter(Boolean);

let bad = 0;
for (const r of routes) {
  try {
    const res = await fetch(`${BASE}${r}`, { redirect: "manual" });
    const mark = res.status < 400 ? "✓" : "✗";
    if (res.status >= 400) bad++;
    console.log(`  ${mark} ${String(res.status).padEnd(3)} ${r}`);
  } catch (e) {
    bad++;
    console.log(`  ✗ ERR ${r} — ${e.message}`);
  }
}
console.log(`\nИтого: ${routes.length} маршрутов, проблемных: ${bad}`);
await db.$disconnect();
