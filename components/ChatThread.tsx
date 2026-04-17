"use client";

import type { ReactNode } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function ChatThread({
  messages,
  input,
  onInputChange,
  onSend,
  disabled,
  sending,
  estimatorLine,
  rateLimitLine,
}: {
  messages: ChatMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  sending: boolean;
  estimatorLine: ReactNode;
  rateLimitLine: ReactNode | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="shrink-0 border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          Chat con el servicio de IA (simulado)
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Escribe un prompt y pulsa Enviar. El proxy aplicará rate limit y cuota
            antes de generar la respuesta.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-3 py-2 text-sm text-white"
                : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <p className="text-sm italic text-zinc-500">Generando…</p>
        )}
      </div>
      <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-700">
        {rateLimitLine}
        <textarea
          className="mb-2 min-h-[88px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          placeholder="Escribe tu prompt…"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!disabled && !sending && input.trim()) onSend();
            }
          }}
        />
        <div className="mb-2 text-xs text-zinc-500">{estimatorLine}</div>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
