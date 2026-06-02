import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Регистрация и вход" };

export default async function AuthPage() {
  // Уже в стае — нечего тут делать, ведём в личный кабинет.
  const user = await getCurrentUser();
  if (user) redirect("/profile");

  return (
    <Container className="py-14 sm:py-20">
      <AuthFlow />
    </Container>
  );
}
