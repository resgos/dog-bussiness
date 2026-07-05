import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { FoundForm } from "@/components/found/FoundForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Сообщить о находке" };

export default async function FoundNewPage() {
  const user = await getCurrentUser();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto mb-8 max-w-xl">
        <Badge tone="found">🔎 Нашли собаку</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Сообщить о находке
        </h1>
        <p className="mt-2 text-ink-soft">
          Нашёл чужую или бездомную собаку? Опубликуй находку — мы оповестим
          хозяев пропавших собак из этого района.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-xl">
        <ShunyaBubble
          src="/shunya/sm/pose-happy.png"
          message="Какой ты молодец, что не прошёл мимо! Опиши находку по-быстрому — и я подниму хозяев района."
        />
      </div>

      <FoundForm
        defaults={{
          finderName: user?.name,
          contactPhone: user?.phone,
          contactTelegram: user?.telegram,
        }}
      />
    </Container>
  );
}
