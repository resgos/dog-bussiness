"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, MessageCircle, Send, Clock } from "lucide-react";
import { findDistrict } from "@/lib/districts";
import { timeAgo, plural } from "@/lib/format";
import { cn } from "@/lib/cn";
import { postJson } from "@/lib/http";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { ReportButton } from "@/components/moderation/ReportButton";
import { postTypeMeta, type PostType } from "./postMeta";

export type CommentLite = {
  id: string;
  text: string;
  authorName: string | null;
  createdAt: string;
};

export type PostLite = {
  id: string;
  type: PostType;
  district: string | null;
  text: string;
  authorName: string | null;
  createdAt: string;
  likes: number;
  liked: boolean;
  comments: CommentLite[];
};

/** Карточка поста с лайком и комментариями. Действия требуют авторизации. */
export function PostCard({ post, canInteract }: { post: PostLite; canInteract: boolean }) {
  const router = useRouter();
  const meta = postTypeMeta[post.type] ?? postTypeMeta.обсуждение;
  const district = post.district ? findDistrict(post.district)?.name : null;

  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [likeBusy, setLikeBusy] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleLike = async () => {
    if (likeBusy) return;
    setError(null);
    if (!canInteract) {
      setError("Войдите, чтобы ставить лайки.");
      return;
    }
    setLikeBusy(true);
    // Оптимистичное обновление.
    const prevLiked = liked;
    const prevLikes = likes;
    setLiked(!prevLiked);
    setLikes(prevLikes + (prevLiked ? -1 : 1));
    try {
      const data = await postJson<{ liked: boolean; likes: number }>(
        `/api/community/posts/${post.id}/like`,
      );
      setLiked(Boolean(data.liked));
      setLikes(Number(data.likes));
      router.refresh();
    } catch {
      setLiked(prevLiked);
      setLikes(prevLikes);
      setError("Не получилось. Попробуйте ещё раз.");
    } finally {
      setLikeBusy(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentBusy) return;
    const text = commentText.trim();
    if (!text) return;
    setError(null);
    setCommentBusy(true);
    try {
      await postJson(`/api/community/posts/${post.id}/comments`, { text });
      setCommentText("");
      router.refresh();
    } catch {
      setError("Не получилось отправить комментарий.");
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-blush bg-card p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Badge tone={meta.tone}>
          <span aria-hidden>{meta.emoji}</span>
          {meta.label}
        </Badge>
        <span className="font-semibold text-ink">{post.authorName ?? "Сосед"}</span>
        {district ? (
          <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="size-4 text-petal" aria-hidden />
            {district}
          </span>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-soft">
          <Clock className="size-3.5" aria-hidden />
          {timeAgo(post.createdAt)}
        </span>
      </div>

      <p className="whitespace-pre-line text-[0.97rem] leading-relaxed text-ink">
        {post.text}
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeBusy}
          aria-pressed={liked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50",
            liked
              ? "border-petal bg-blush text-petal-deep"
              : "border-blush bg-card text-ink-soft hover:border-petal/60 hover:text-ink",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
          {likes > 0 ? (
            <span>
              {likes} {plural(likes, "лайк", "лайка", "лайков")}
            </span>
          ) : (
            <span>Нравится</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className="inline-flex items-center gap-1.5 rounded-full border border-blush bg-card px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-petal/60 hover:text-ink"
        >
          <MessageCircle className="size-4" aria-hidden />
          {post.comments.length}{" "}
          {plural(post.comments.length, "комментарий", "комментария", "комментариев")}
        </button>

        <span className="ml-auto">
          <ReportButton targetType="post" targetId={post.id} />
        </span>
      </div>

      {error ? (
        <p className="text-sm text-status-lost">{error}</p>
      ) : null}

      {showComments ? (
        <div className="mt-1 space-y-3 border-t border-blush pt-3">
          {post.comments.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Пока нет комментариев. Будьте первым!
            </p>
          ) : (
            <ul className="space-y-2.5">
              {post.comments.map((c) => (
                <li key={c.id} className="rounded-2xl bg-blush-soft px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {c.authorName ?? "Сосед"}
                    </span>
                    <span className="text-xs text-ink-soft">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink">{c.text}</p>
                </li>
              ))}
            </ul>
          )}

          {canInteract ? (
            <form onSubmit={submitComment} className="flex items-end gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавить комментарий…"
                maxLength={500}
                className="text-sm"
              />
              <button
                type="submit"
                disabled={commentBusy || !commentText.trim()}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-paw text-ink shadow-soft transition-all hover:bg-paw-deep disabled:opacity-50"
                aria-label="Отправить комментарий"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink-soft">
              <a href="/auth" className="font-semibold text-petal-deep underline">
                Войдите
              </a>
              , чтобы комментировать.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
