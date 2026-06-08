import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ScanLine } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductPurchase } from "@/components/shop/ProductPurchase";
import { categoryLabel, categoryTone } from "@/components/shop/categories";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { order: "asc" } },
      variants: { orderBy: [{ name: "asc" }, { order: "asc" }] },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? `${product.name} · Магазин` : "Товар" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const isAddressnik = product.category === "addressniki";

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-petal-deep"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Назад в магазин
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Фото */}
        <ProductGallery
          images={[
            ...(product.image ? [{ url: product.image }] : []),
            ...product.images.map((im) => ({ url: im.url })),
          ]}
          alt={product.name}
        />

        {/* Информация */}
        <div className="flex flex-col gap-5">
          <div>
            <Badge tone={categoryTone(product.category)}>
              {categoryLabel(product.category)}
            </Badge>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          </div>

          {product.description ? (
            <p className="leading-relaxed text-ink-soft">{product.description}</p>
          ) : null}

          {isAddressnik ? (
            <div className="flex items-start gap-3 rounded-2xl bg-blush-soft p-4">
              <ScanLine className="mt-0.5 size-5 shrink-0 text-petal" aria-hidden />
              <p className="text-sm leading-relaxed text-ink">
                На адреснике — QR-код паспорта питомца. Наведи камеру, и нашедший
                сразу увидит кличку и контакты хозяина.
              </p>
            </div>
          ) : null}

          <div className="pt-2">
            <ProductPurchase
              productId={product.id}
              basePrice={product.priceRub}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                value: v.value,
                priceDelta: v.priceDelta,
              }))}
            />
          </div>

          <p className="text-sm text-ink-soft">
            Бережно упакуем и доставим по Москве. Оплата при получении.
          </p>
        </div>
      </div>
    </Container>
  );
}
