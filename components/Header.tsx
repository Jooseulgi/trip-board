import Link from "next/link";
import { NameChip } from "./NameChip";

export function Header({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight">
          <span aria-hidden>🧳</span> 트립보드
        </Link>
        <NameChip name={name} />
      </div>
    </header>
  );
}
