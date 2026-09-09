"use client";

import { useState } from "react";
import { saveName } from "@/app/actions";

export function NameChip({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-accent"
      >
        {name} <span className="text-muted">· 이름 바꾸기</span>
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await saveName(formData);
        setEditing(false);
      }}
      className="flex items-center gap-1"
    >
      <input
        name="name"
        defaultValue={name}
        autoFocus
        maxLength={20}
        onBlur={() => setEditing(false)}
        className="w-28 rounded-full border border-accent bg-surface px-3 py-1.5 text-xs outline-none"
      />
      <button
        type="submit"
        onMouseDown={(e) => e.preventDefault()}
        className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
      >
        저장
      </button>
    </form>
  );
}
