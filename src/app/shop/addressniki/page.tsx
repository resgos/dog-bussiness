import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { CatalogGrid } from "@/components/shop/CatalogGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Адресники" };

export default async function AddressnikiPage() {
  const products = await db.product.findMany({
    where: { category: "addressniki" },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      category: true,
      priceRub: true,
      image: true,
    },
  });

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8">
        <Badge tone="petal">🏷️ Адресники</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Адресники с QR-кодом</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Кастомные адресники ручной работы. Сканируешь QR — сразу контакты
          хозяина и паспорт питомца.
        </p>
      </div>

      <div className="mb-6">
        <CategoryNav active="addressniki" />
      </div>

      <CatalogGrid
        products={products}
        emptyText="Адресники скоро появятся — Шуня уже грызёт первый образец!"
      />
    </Container>
  );
}
