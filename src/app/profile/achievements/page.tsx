import { PagePlaceholder } from "@/components/PagePlaceholder";
import { placeholders } from "@/lib/placeholders";

const meta = placeholders["/profile/achievements"];

export const metadata = { title: meta.title };

export default function Page() {
  return <PagePlaceholder {...meta} />;
}