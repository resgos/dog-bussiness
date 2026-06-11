import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FoundReportEditForm } from "@/components/found/FoundReportEditForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Изменить объявление о находке" };

export default async function EditFoundReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const report = await db.foundReport.findUnique({ where: { id } });
  // Только владелец находки (нашедший, если был залогинен). Иначе 404.
  if (!report || !user || report.userId !== user.id) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <ButtonLink href={`/found/${report.id}`} variant="ghost" size="sm">
        <ArrowLeft className="size-4" aria-hidden />
        К находке
      </ButtonLink>

      <div className="mb-8 mt-4">
        <Badge tone="found">✏️ Редактирование</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Изменить находку</h1>
        <p className="mt-2 text-ink-soft">
          Уточни приметы или контакты — изменения сразу видны всем.
        </p>
      </div>

      <FoundReportEditForm
        found={{
          id: report.id,
          finderName: report.finderName,
          contactPhone: report.contactPhone,
          contactTelegram: report.contactTelegram,
          breed: report.breed,
          color: report.color,
          size: report.size,
          district: report.district,
          comment: report.comment,
        }}
      />
    </Container>
  );
}
