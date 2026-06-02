import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { SettingsForm } from "@/components/auth/SettingsForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Настройки профиля" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        <Badge tone="petal">⚙️ Настройки</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Профиль и согласия</h1>
        <p className="mt-2 text-ink-soft">
          Обнови данные — так соседи и Шуня будут на одной волне с тобой.
        </p>

        <div className="mt-8 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8">
          <SettingsForm
            name={user.name}
            district={user.district}
            telegram={user.telegram}
          />
        </div>

        <div className="mt-8">
          <ButtonLink href="/profile" variant="ghost">
            <ArrowLeft className="size-4" aria-hidden />
            В личный кабинет
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
