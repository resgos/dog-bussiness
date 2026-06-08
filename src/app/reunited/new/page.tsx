import { Heart, LogIn } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { ReunionForm } from "@/components/reunion/ReunionForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Рассказать историю" };

export default async function ReunitedNewPage() {
  const user = await getCurrentUser();

  // —— Гость: призыв войти ——
  if (!user) {
    return (
      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <Badge tone="found">💞 Истории спасения</Badge>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Войди в стаю</h1>
          <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
            <p className="text-ink-soft">
              Чтобы поделиться историей счастливого возвращения, войди в аккаунт.
              Так история будет привязана к тебе, а стая узнает героев в лицо.
            </p>
            <div className="mt-6">
              <ButtonLink href="/auth" size="lg">
                <LogIn className="size-5" aria-hidden />
                Войти или зарегистрироваться
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto mb-8 max-w-xl">
        <Badge tone="found">💞 Истории спасения</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Расскажи свою историю
        </h1>
        <p className="mt-2 text-ink-soft">
          Как нашлась твоя собака? Поделись — твоя история подарит надежду тем,
          кто ещё в поиске.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-xl">
        <ShunyaBubble
          src="/shunya/pose-happy.png"
          message="Обожаю счастливые финалы! Добавь фото и пару тёплых слов — и история украсит ленту."
          bubbleClassName="flex items-center gap-2"
        />
      </div>

      <div className="mx-auto max-w-xl">
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-coral">
          <Heart className="size-4 fill-current" aria-hidden />
          Спасибо, что делишься радостью со стаей
        </p>
        <ReunionForm />
      </div>
    </Container>
  );
}
