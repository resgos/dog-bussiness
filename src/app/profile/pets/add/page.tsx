import { Container } from "@/components/ui/Container";
import { PetWizard } from "@/components/pets/PetWizard";

export const metadata = { title: "Добавить питомца" };

export default function AddPetPage() {
  return (
    <Container className="py-12 sm:py-16">
      <PetWizard />
    </Container>
  );
}
