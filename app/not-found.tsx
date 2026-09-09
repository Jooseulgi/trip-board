import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="text-4xl">🗺️</p>
      <h1 className="text-lg font-semibold">여기엔 아무것도 없네요</h1>
      <p className="text-sm text-muted">지워졌거나 주소가 잘못됐을 수 있어요.</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
      >
        보드로 돌아가기
      </Link>
    </main>
  );
}
