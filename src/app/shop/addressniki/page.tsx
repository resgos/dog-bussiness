import { PagePlaceholder } from "@/components/PagePlaceholder";
import { placeholders } from "@/lib/placeholders";

const meta = placeholders["/shop/addressniki"];

export const metadata = { title: meta.title };

export default function Page() {
  return <PagePlaceholder {...meta} />;
}