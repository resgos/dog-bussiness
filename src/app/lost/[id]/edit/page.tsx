import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { LostReportEditForm } from "@/components/feed/LostReportEditForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Изменить объявление о пропаже" };

export default async function EditLostReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const report = await db.lostReport.findUnique({ where: { id } });
  // Только владелец активного/своего объявления. Иначе 404 (без раскрытия).
  if (!report || !user || report.userId !== user.id) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <ButtonLink href="/profile/my-searches" variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden />
        К моим поискам
      </ButtonLink>

      <div className="mb-8 mt-4">
        <Badge tone="lost">✏️ Редактирование</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Изменить объявление
        </h1>
        <p className="mt-2 text-ink-soft">
          Уточни приметы, район или награду — изменения сразу видны всем.
        </p>
      </div>

      <LostReportEditForm
        report={{
          id: report.id,
          petName: report.petName,
          breed: report.breed,
          color: report.color,
          size: report.size,
          district: report.district,
          reward: report.reward,
          comment: report.comment,
        }}
      />
    </Container>
  );
}
