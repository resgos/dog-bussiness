"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Checkbox } from "@/components/ui/Field";
import { districtsByOkrug } from "@/lib/districts";
import { updateProfileAction, type AuthState } from "@/components/auth/actions";

type Props = {
  name: string;
  district: string | null;
  telegram: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Сохраняю…" : "Сохранить изменения"}
    </Button>
  );
}

export function SettingsForm({ name, district, telegram }: Props) {
  const [state, formAction] = useActionState<AuthState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Как тебя зовут?" required>
        <Input
          name="name"
          defaultValue={name}
          placeholder="Например, Аня"
          autoComplete="name"
          required
        />
      </Field>

      <Field label="Район проживания" hint="По нему я подбираю пропажи рядом">
        <Select name="district" defaultValue={district ?? ""}>
          <option value="">Не выбран</option>
          {Object.entries(districtsByOkrug()).map(([okrug, list]) => (
            <optgroup key={okrug} label={okrug}>
              {list.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.pilot ? " ⭐ пилот" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field label="Telegram" hint="Чтобы получать оповещения о пропажах">
        <Input
          name="telegram"
          defaultValue={telegram ?? ""}
          placeholder="@username"
        />
      </Field>

      <div className="space-y-3 pt-2">
        <Checkbox
          name="consentNotify"
          defaultChecked
          label="Хочу получать уведомления о пропажах и находках в моём районе"
        />
        <Checkbox
          name="consentRules"
          defaultChecked
          label="Соблюдаю правила добрососедства: помогаю по-доброму и без спама"
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-2xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm font-medium text-status-lost"
        >
          {state.error}
        </p>
      ) : state.saved ? (
        <p className="inline-flex items-center gap-2 rounded-2xl bg-status-found/15 px-4 py-3 text-sm font-bold text-[#4f9e63]">
          <Check className="size-4" aria-hidden />
          Сохранено!
        </p>
      ) : null}

      <div className="pt-2">
        <SaveButton />
      </div>
    </form>
  );
}
