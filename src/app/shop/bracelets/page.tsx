import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { CategoryNav } from "@/components/shop/CategoryNav";
import { CatalogGrid } from "@/components/shop/CatalogGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Браслеты и аксессуары" };

export default async function BraceletsPage() {
  const products = await db.product.findMany({
    where: { category: "bracelets" },
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
        <Badge tone="paw">💫 Браслеты</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Браслеты и аксессуары</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Браслеты, брелоки и аксессуары с Шуней — носи стаю с собой.
        </p>
      </div>

      <div className="mb-6">
        <CategoryNav active="bracelets" />
      </div>

      <CatalogGrid
        products={products}
        emptyText="Браслеты скоро появятся — собираем первую партию!"
      />
    </Container>
  );
}
