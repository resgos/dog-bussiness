import { PagePlaceholder } from "@/components/PagePlaceholder";
import { placeholders } from "@/lib/placeholders";

const meta = placeholders["/community/districts"];

export const metadata = { title: meta.title };

export default function Page() {
  return <PagePlaceholder {...meta} />;
}