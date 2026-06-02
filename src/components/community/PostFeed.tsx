"use client";

import { useMemo, useState } from "react";
import { TagToggle } from "@/components/ui/TagToggle";
import { Select } from "@/components/ui/Field";
import { findDistrict } from "@/lib/districts";
import { plural } from "@/lib/format";
import { ShunyaBubble } from "@/components/brand/ShunyaBubble";
import { PostCard, type PostLite } from "./PostCard";
import { POST_TYPES, postTypeMeta, type PostType } from "./postMeta";

/** Лента постов с клиентскими фильтрами по типу и району. */
export function PostFeed({
  posts,
  canInteract,
}: {
  posts: PostLite[];
  canInteract: boolean;
}) {
  const [type, setType] = useState<PostType | "all">("all");
  const [district, setDistrict] = useState<string>("all");

  // Районы, по которым реально есть посты — чтобы не плодить пустой селект.
  const districts = useMemo(() => {
    const ids = new Set<string>();
    for (const p of posts) if (p.district) ids.add(p.district);
    return [...ids]
      .map((id) => ({ id, name: findDistrict(id)?.name ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [posts]);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (type === "all" || p.type === type) &&
          (district === "all" || p.district === district),
      ),
    [posts, type, district],
  );

  return (
    <div className="space-y-6">
      {/* Фильтр по типу */}
      <div className="flex flex-wrap items-center gap-2">
        <TagToggle active={type === "all"} onClick={() => setType("all")}>
          Все
        </TagToggle>
        {POST_TYPES.map((t) => (
          <TagToggle key={t} active={type === t} onClick={() => setType(t)}>
            <span aria-hidden className="mr-1">
              {postTypeMeta[t].emoji}
            </span>
            {postTypeMeta[t].label}
          </TagToggle>
        ))}
      </div>

      {/* Фильтр по району (если есть из чего выбирать) */}
      {districts.length > 1 ? (
        <Select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="max-w-xs"
          aria-label="Фильтр по району"
        >
          <option value="all">Все районы</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      ) : null}

      <p className="text-sm text-ink-soft">
        {filtered.length} {plural(filtered.length, "пост", "поста", "постов")}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-blush bg-card p-6 shadow-card">
          <ShunyaBubble
            message={
              posts.length === 0
                ? "В ленте пока тихо. Будьте первым — расскажите соседям новость!"
                : "По этому фильтру ничего нет. Попробуйте другой тип или район."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} canInteract={canInteract} />
          ))}
        </div>
      )}
    </div>
  );
}
