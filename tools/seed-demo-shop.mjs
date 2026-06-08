// Демо-данные магазина: галерея (ProductImage) + параметры (ProductVariant) для товаров.
// Идемпотентно: добавляет только если ещё нет.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const GALLERY = ["/shop/merch-tags.png", "/shunya/pose-happy.png", "/shop/merch-bracelet.png"];
const VARIANTS = [
  { name: "Цвет", values: ["Розовый", "Голубой", "Мятный", "Графит"] },
  { name: "Размер", values: ["S", "M", "L"] },
];

const products = await db.product.findMany({
  include: { images: true, variants: true },
});
let imgN = 0, varN = 0;
for (const p of products) {
  if (p.images.length === 0) {
    // не дублируем обложку: берём 2 дополнительных кадра
    const extra = GALLERY.filter((u) => u !== p.image).slice(0, 2);
    for (let i = 0; i < extra.length; i++) {
      await db.productImage.create({ data: { productId: p.id, url: extra[i], order: i } });
      imgN++;
    }
  }
  if (p.variants.length === 0) {
    for (const grp of VARIANTS) {
      for (let i = 0; i < grp.values.length; i++) {
        await db.productVariant.create({
          data: { productId: p.id, name: grp.name, value: grp.values[i], priceDelta: 0, order: i },
        });
        varN++;
      }
    }
  }
}
console.log(`Товаров: ${products.length}. Добавлено изображений: ${imgN}, вариантов: ${varN}.`);
await db.$disconnect();
