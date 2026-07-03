import Link from "next/link";
import { LogIn, ReceiptText, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { purchaseLabel } from "@/lib/purchases";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Мои покупки" };

// Виды покупок, у которых refId — это розыск: даём ссылку на объявление.
const REPORT_KINDS = new Set(["boost", "reward-donation", "poster-service"]);

/**
 * «Мои покупки» — прозрачность оплат (обязательна перед реальным шлюзом):
 * история Purchase текущего пользователя по каналам с датами, суммами и
 * ссылками на связанные розыски.
 */
export default async function PurchasesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Container className="py-12 sm:py-16">
        <Badge tone="petal">🧾 Покупки</Badge>
        <h1 className="mb-8 mt-3 text-3xl font-bold sm:text-4xl">Мои покупки</h1>
        <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <ReceiptText className="mx-auto size-12 text-petal" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Войдите, чтобы видеть покупки</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            История оплат привязана к аккаунту: продвижения, донаты на награды,
            расклейка плакатов и подписка.
          </p>
          <div className="mt-6">
            <ButtonLink href="/auth" size="lg">
              <LogIn className="size-5" aria-hidden />
              Войти
            </ButtonLink>
          </div>
        </div>
      </Container>
    );
  }

  const purchases = await db.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const totalRub = purchases.reduce((a, p) => a + p.amountRub, 0);

  return (
    <Container className="py-12 sm:py-16">
      <Badge tone="petal">🧾 Покупки</Badge>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Мои покупки</h1>
      <p className="mt-1 text-ink-soft">
        Все оплаты аккаунта — прозрачно (демо-оплаты без списаний).
      </p>

      {purchases.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
          <Wallet className="mx-auto size-12 text-petal" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Покупок пока нет</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Здесь появятся продвижения объявлений, донаты на награды и другие
            оплаты.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 inline-flex items-baseline gap-2 rounded-2xl bg-blush-soft px-5 py-3">
            <span className="text-sm font-semibold text-ink-soft">Итого:</span>
            <span
              className="font-display text-2xl font-bold"
              data-purchases-total={totalRub}
            >
              {totalRub.toLocaleString("ru-RU")} ₽
            </span>
          </p>
          <ul className="mt-6 space-y-3">
            {purchases.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-blush bg-card px-5 py-4 shadow-card"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{purchaseLabel(p.kind)}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {timeAgo(p.createdAt)}
                    {REPORT_KINDS.has(p.kind) && p.refId ? (
                      <>
                        {" · "}
                        <Link
                          href={`/lost/${p.refId}`}
                          className="font-semibold text-petal-deep hover:underline"
                        >
                          открыть объявление
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 font-display text-lg font-bold text-petal-deep">
                  {p.amountRub.toLocaleString("ru-RU")} ₽
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Container>
  );
}
