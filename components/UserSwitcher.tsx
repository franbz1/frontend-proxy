"use client";

const DEMO_USERS = [
  { id: "demo-free", label: "Demo Free" },
  { id: "demo-pro", label: "Demo Pro" },
  { id: "demo-enterprise", label: "Demo Enterprise" },
] as const;

export function UserSwitcher({
  userId,
  onChange,
}: {
  userId: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">Usuario (X-User-Id)</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={userId}
        onChange={(e) => onChange(e.target.value)}
      >
        {DEMO_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label} ({u.id})
          </option>
        ))}
      </select>
    </label>
  );
}
