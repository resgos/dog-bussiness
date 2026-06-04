import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Пользовательское соглашение (оферта)" };

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink">
        {n}. {title}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function OfferPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Badge tone="neutral">Документ</Badge>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Пользовательское соглашение
        </h1>
        <p className="mt-3 rounded-2xl bg-paw/20 px-4 py-3 text-sm font-semibold text-ink">
          ⚠️ Черновик-«рыба» для MVP. Перед запуском требует проверки юристом.
        </p>

        <Section n="1" title="Общие положения">
          <p>
            Настоящее соглашение регулирует использование сервиса «Лапка
            помощи» — городской платформы взаимопомощи по поиску потерявшихся и
            найденных собак. Используя Сервис, вы принимаете условия соглашения.
          </p>
        </Section>

        <Section n="2" title="Что делает Сервис">
          <p>
            Помогает публиковать объявления о пропаже и находке, оповещать
            соседей района, отмечать наблюдения на карте, вести цифровой паспорт
            питомца с QR и заказывать адресники. Сервис — площадка для связи
            между пользователями и не несёт ответственности за достоверность
            публикуемых ими сведений.
          </p>
        </Section>

        <Section n="3" title="Правила добрососедства">
          <p>
            Запрещены спам, оскорбления, публикация заведомо ложных объявлений,
            чужих контактов без согласия и любой противоправный контент.
            Нарушения могут привести к блокировке аккаунта.
          </p>
        </Section>

        <Section n="4" title="Контент пользователей">
          <p>
            Публикуя фото и тексты, вы подтверждаете право на их использование и
            предоставляете Сервису неисключительную лицензию на их показ в рамках
            работы платформы.
          </p>
        </Section>

        <Section n="5" title="Магазин">
          <p>
            Заказы в магазине оформляются для последующего подтверждения по
            телефону. Условия оплаты и доставки согласуются индивидуально на
            этапе MVP.
          </p>
        </Section>

        <Section n="6" title="Ответственность и изменения">
          <p>
            Сервис предоставляется «как есть». Мы вправе обновлять условия
            соглашения; актуальная версия публикуется на этой странице. Вопросы —
            hello@lapka-pomoshchi.ru.
          </p>
        </Section>
      </div>
    </Container>
  );
}
