import Link from "next/link";
import { LogIn, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { districtsByOkrug } from "@/lib/districts";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { PostFeed } from "@/components/community/PostFeed";
import type { PostLite } from "@/components/community/PostCard";
import type { PostType } from "@/components/community/postMeta";

export const dynamic = "force-dynamic";
export const metadata = { title: "Комьюнити" };

export default async function CommunityPage() {
  const user = await getCurrentUser();

  const posts = await db.post.findMany({
    include: { author: true, comments: { include: { author: true } }, likes: true },
    orderBy: { createdAt: "desc" },
  });

  // Сериализуем для клиентских компонентов (Date → ISO) и помечаем «мой лайк».
  const feed: PostLite[] = posts.map((p) => ({
    id: p.id,
    type: p.type as PostType,
    district: p.district,
    text: p.text,
    authorName: p.author?.name ?? null,
    createdAt: p.createdAt.toISOString(),
    likes: p.likes.length,
    liked: user ? p.likes.some((l) => l.userId === user.id) : false,
    comments: p.comments
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((c) => ({
        id: c.id,
        text: c.text,
        authorName: c.author?.name ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
  }));

  // Группы районов для селекта в форме создания поста.
  const okrugs = Object.entries(districtsByOkrug()).map(([okrug, list]) => ({
    okrug,
    districts: list.map((d) => ({ id: d.id, name: d.name })),
  }));

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-1.5 text-sm font-bold text-petal-deep">
            <Users className="size-4" aria-hidden />
            Комьюнити
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Районная лента</h1>
          <p className="mt-1 text-ink-soft">
            Новости, находки и советы от соседей по району.
          </p>
        </div>
        <ButtonLink href="/community/volunteers" variant="secondary">
          🏆 Рейтинг волонтёров
        </ButtonLink>
      </div>

      {/* Создание поста или приглашение войти */}
      {user ? (
        <div className="mb-8">
          <CreatePostForm
            authorName={user.name}
            defaultDistrict={user.district}
            okrugs={okrugs}
          />
        </div>
      ) : (
        <Card className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ShunyaBubble
            message="Войдите, чтобы публиковать посты, ставить лайки и комментировать соседей."
            size={88}
          />
          <ButtonLink href="/auth" className="shrink-0">
            <LogIn className="size-4" aria-hidden />
            Войти
          </ButtonLink>
        </Card>
      )}

      <PostFeed posts={feed} canInteract={Boolean(user)} />

      {!user ? (
        <p className="mt-6 text-center text-sm text-ink-soft">
          Уже с нами?{" "}
          <Link href="/auth" className="font-semibold text-petal-deep underline">
            Войдите
          </Link>
          , чтобы участвовать в обсуждениях.
        </p>
      ) : null}
    </Container>
  );
}
