import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Регистрация и вход" };

export default async function AuthPage({
  searchParams,
}: {
  // В Next 15 searchParams — Promise, его нужно await.
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  // Уже в стае — нечего тут делать, ведём в личный кабинет.
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  // Код приглашения из ссылки соседа (?ref=...). Берём первое значение, если их несколько.
  const { ref } = await searchParams;
  const referral = Array.isArray(ref) ? ref[0] : ref;

  return (
    <Container className="py-14 sm:py-20">
      <AuthFlow referral={referral} />
    </Container>
  );
}
