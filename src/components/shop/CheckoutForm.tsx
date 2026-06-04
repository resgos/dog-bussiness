"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SuccessNote } from "@/components/ui/SuccessNote";
import { postJson } from "@/lib/http";

type Props = {
  /** Префилл из профиля, если пользователь залогинен. */
  defaultName?: string;
  defaultPhone?: string;
};

/** Форма оформления заказа → POST /api/shop/checkout, затем экран успеха. */
export function CheckoutForm({ defaultName = "", defaultPhone = "" }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !phone.trim()) {
      setError("Укажи имя и телефон для связи.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const j = await postJson<{ orderId: string }>("/api/shop/checkout", {
        name,
        phone,
        address,
      });
      setOrderId(j.orderId);
      router.refresh(); // корзина очищена на сервере
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось оформить заказ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderId) {
    return (
      <div className="rounded-3xl border border-blush bg-card p-8 text-center shadow-card">
        <SuccessNote className="mb-3">Заказ оформлен</SuccessNote>
        <h2 className="text-2xl font-bold sm:text-3xl">Спасибо! Уже мчим за заказом 🐾</h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Заказ <span className="font-mono font-semibold text-ink">#{orderId.slice(0, 8)}</span>{" "}
          принят. Мы свяжемся с тобой по телефону для подтверждения и доставки.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/profile/orders" size="lg">
            <PackageCheck className="size-5" aria-hidden />
            Мои заказы
          </ButtonLink>
          <ButtonLink href="/shop" variant="secondary" size="lg">
            <ShoppingBag className="size-5" aria-hidden />
            Продолжить покупки
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-3xl border border-blush bg-card p-6 shadow-card sm:p-8"
    >
      <h2 className="text-xl font-bold">Оформление заказа</h2>

      <Field label="Имя" required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к тебе обращаться"
          autoComplete="name"
        />
      </Field>

      <Field label="Телефон" required hint="Для подтверждения заказа">
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+7 ___ ___-__-__"
          autoComplete="tel"
        />
      </Field>

      <Field label="Адрес доставки" hint="Город, улица, дом, квартира">
        <Textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Москва, ул. Лапушкина, 7, кв. 12"
          autoComplete="street-address"
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Оформляю…" : "Оформить заказ"}
      </Button>
      {error ? (
        <p className="text-center text-sm text-status-lost">{error}</p>
      ) : null}
    </form>
  );
}
