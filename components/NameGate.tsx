"use client";

import { useState } from "react";
import { saveName } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

export function NameGate() {
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-4xl">🧳</div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">트립보드</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            가고 싶은 디저트랑 장소를 캡쳐해서 올리고,
            <br />
            친구랑 코멘트로 같이 골라보세요.
          </p>
        </div>

        <form
          action={async (formData) => {
            const result = await saveName(formData);
            setError(result.ok ? null : (result.error ?? "다시 시도해주세요."));
          }}
          className="rounded-2xl border border-line bg-surface p-5 shadow-sm"
        >
          <label htmlFor="name" className="block text-sm font-medium">
            어떤 이름으로 남길까요?
          </label>
          <input
            id="name"
            name="name"
            autoFocus
            maxLength={20}
            placeholder="예: 슬기"
            className="mt-2 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <p className="mt-2 text-xs text-muted">
            비밀번호는 없어요. 이 이름으로 글과 코멘트가 남습니다.
          </p>
          {error && <p className="mt-2 text-xs text-accent">{error}</p>}
          <div className="mt-4 flex justify-end">
            <SubmitButton pendingLabel="들어가는 중…">시작하기</SubmitButton>
          </div>
        </form>
      </div>
    </main>
  );
}
