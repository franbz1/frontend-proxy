"use client";

export function UserSwitcher({
  userId,
  onChange,
  options,
  loading,
}: {
  userId: string;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
  loading?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">
        Usuario (X-User-Id)
        {loading ? (
          <span className="ml-2 text-xs font-normal text-zinc-400">
            cargando lista…
          </span>
        ) : null}
      </span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        value={userId}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading && options.length === 0}
      >
        {options.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </select>
    </label>
  );
}
