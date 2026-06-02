import { Container } from "@/components/ui/Container";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata = { title: "Регистрация и вход" };

export default function AuthPage() {
  return (
    <Container className="py-14 sm:py-20">
      <OnboardingFlow />
    </Container>
  );
}
