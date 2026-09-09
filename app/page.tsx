import { Composer } from "@/components/Composer";
import { FilterBar } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import { NameGate } from "@/components/NameGate";
import { PostCard } from "@/components/PostCard";
import { isCategoryKey } from "@/lib/categories";
import { getCategoryCounts, getFeed } from "@/lib/posts";
import { getMyName } from "@/lib/session";

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage(props: PageProps<"/">) {
  const myName = await getMyName();
  if (!myName) return <NameGate />;

  const searchParams = await props.searchParams;
  const rawCategory = single(searchParams.cat);
  const rawOnly = single(searchParams.only);

  const category = isCategoryKey(rawCategory) ? rawCategory : undefined;
  const only = rawOnly === "wish" || rawOnly === "todo" ? rawOnly : undefined;

  const [posts, counts] = await Promise.all([
    getFeed(myName, { category, only }),
    getCategoryCounts(),
  ]);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      <Header name={myName} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="flex flex-col gap-5">
          <Composer />
          <FilterBar category={category} only={only} counts={counts} total={total} />

          {posts.length === 0 ? (
            <EmptyState filtered={Boolean(category || only)} />
          ) : (
            <div className="masonry">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="px-4 py-8 text-center text-xs text-muted">
        캡쳐해서 ⌘V — 그게 전부예요.
      </footer>
    </>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <p className="text-3xl">{filtered ? "🔍" : "🍰"}</p>
      <p className="mt-3 text-sm font-medium">
        {filtered ? "여기엔 아직 아무것도 없어요." : "첫 번째 장소를 올려볼까요?"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {filtered
          ? "다른 필터를 눌러보세요."
          : "인스타나 지도에서 캡쳐한 사진을 붙여넣으면 바로 카드가 만들어져요."}
      </p>
    </div>
  );
}
