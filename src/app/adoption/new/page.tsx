import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { AdoptionForm } from "@/components/adoption/AdoptionForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Разместить собаку" };

export default async function AdoptionNewPage() {
  const user = await getCurrentUser();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto mb-8 max-w-xl">
        <Badge tone="petal">🏠 Пристройство</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Разместить собаку
        </h1>
        <p className="mt-2 text-ink-soft">
          Пристраиваешь хвостика из приюта или в добрые руки? Расскажи о нём —
          объявление попадёт в общую ленту, и собаку увидят будущие хозяева.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-xl">
        <ShunyaBubble
          src="/shunya/pose-happy.png"
          message="Давай найдём этому хорошему мальчику или девочке настоящий дом! Опиши собаку потеплее — я помогу подобрать ей семью."
        />
      </div>

      <AdoptionForm
        defaults={{
          contactName: user?.name,
          contactPhone: user?.phone,
          contactTelegram: user?.telegram,
        }}
      />
    </Container>
  );
}
