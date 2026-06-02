"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { POST_TYPES, postTypeMeta, type PostType } from "./postMeta";

type DistrictOption = { id: string; name: string };
type OkrugGroup = { okrug: string; districts: DistrictOption[] };

/** Форма создания поста в районной ленте (только для авторизованных). */
export function CreatePostForm({
  authorName,
  defaultDistrict,
  okrugs,
}: {
  authorName: string;
  defaultDistrict: string | null;
  okrugs: OkrugGroup[];
}) {
  const router = useRouter();
  const [type, setType] = useState<PostType>("обсуждение");
  const [district, setDistrict] = useState<string>(defaultDistrict ?? "");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Напишите, чем хотите поделиться.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, district: district || null, text: trimmed }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setType("обсуждение");
      router.refresh();
    } catch {
      setError("Не получилось опубликовать. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">Поделиться с районом</h2>
        <p className="text-sm text-ink-soft">
          Вы публикуете как <span className="font-semibold text-ink">{authorName}</span>.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Тип поста">
            <Select value={type} onChange={(e) => setType(e.target.value as PostType)}>
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {postTypeMeta[t].emoji} {postTypeMeta[t].label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Район" hint="Необязательно — поможет соседям рядом">
            <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">Без района</option>
              {okrugs.map((g) => (
                <optgroup key={g.okrug} label={g.okrug}>
                  {g.districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Сообщение" required>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите соседям новость, задайте вопрос или поделитесь советом…"
            maxLength={1000}
            rows={3}
          />
        </Field>

        {error ? <p className="text-sm text-status-lost">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !text.trim()}>
            <Send className="size-4" aria-hidden />
            {busy ? "Публикуем…" : "Опубликовать"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
