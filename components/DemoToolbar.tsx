"use client";

import { useState } from "react";
import {
  postGenerate,
  postResetRateLimit,
} from "@/lib/api/client";
import type { GenerationResponse } from "@/lib/types/quota";
import { ApiRequestError } from "@/lib/types/quota";
import { estimateTotalTokensForPrompt } from "@/lib/token-estimate";

const BURST_MAX = 40;

type DemoToolbarProps = {
  userId: string;
  onGenerationSuccess: (
    res: GenerationResponse,
    meta: {
      source: "burst" | "demo-prompt";
      /** Chat label for demo-prompt only */
      userLine?: string;
    }
  ) => void;
  onRateLimited: (retryAfterSeconds: number) => void;
  onQuotaExhausted: () => void;
  refreshQuota: () => Promise<void>;
};

export function DemoToolbar({
  userId,
  onGenerationSuccess,
  onRateLimited,
  onQuotaExhausted,
  refreshQuota,
}: DemoToolbarProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [burstNote, setBurstNote] = useState<string | null>(null);

  const runBurst = async () => {
    setBusy("burst");
    setBurstNote(null);
    let n = 0;
    try {
      for (let i = 0; i < BURST_MAX; i++) {
        const res = await postGenerate(userId, "ping");
        n = i + 1;
        onGenerationSuccess(res, { source: "burst" });
      }
      setBurstNote(`Sent ${n} requests (no 429 in ${BURST_MAX} tries).`);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 429) {
          const sec = e.retryAfterSeconds ?? 60;
          onRateLimited(sec);
          setBurstNote(`429 after ${n} successful request(s).`);
          return;
        }
        if (e.status === 402) {
          onQuotaExhausted();
          setBurstNote("402 quota exhausted before rate limit.");
          return;
        }
      }
      setBurstNote(e instanceof Error ? e.message : "Burst failed");
    } finally {
      await refreshQuota();
      setBusy(null);
    }
  };

  const sendFixedPrompt = async (kind: "short" | "long") => {
    const prompt =
      kind === "short"
        ? "Hi"
        : "word ".repeat(600).trim();
    setBusy(kind);
    try {
      const res = await postGenerate(userId, prompt);
      onGenerationSuccess(res, {
        source: "demo-prompt",
        userLine:
          kind === "short"
            ? "[demo] Short prompt"
            : "[demo] Long prompt",
      });
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 429) {
          onRateLimited(e.retryAfterSeconds ?? 60);
          return;
        }
        if (e.status === 402) {
          onQuotaExhausted();
          return;
        }
      }
      setBurstNote(e instanceof Error ? e.message : "Request failed");
    } finally {
      await refreshQuota();
      setBusy(null);
    }
  };

  const resetRl = async () => {
    setBusy("reset-rl");
    try {
      await postResetRateLimit();
      setBurstNote("Rate limit counters cleared.");
    } catch (e) {
      setBurstNote(e instanceof Error ? e.message : "Reset failed");
    } finally {
      await refreshQuota();
      setBusy(null);
    }
  };

  const shortTokens = estimateTotalTokensForPrompt("Hi");
  const longPrompt = "word ".repeat(600).trim();
  const longTokens = estimateTotalTokensForPrompt(longPrompt);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-3 text-sm dark:border-zinc-600 dark:bg-zinc-900/40">
      <p className="font-medium text-zinc-700 dark:text-zinc-200">
        Demo: proxy actions
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          disabled={!!busy}
          onClick={() => void runBurst()}
        >
          {busy === "burst" ? "Bursting…" : "Burst until 429"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          disabled={!!busy}
          onClick={() => void sendFixedPrompt("short")}
        >
          Short prompt (~{shortTokens} tok)
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          disabled={!!busy}
          onClick={() => void sendFixedPrompt("long")}
        >
          Long prompt (~{longTokens} tok)
        </button>
        <button
          type="button"
          className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-100 dark:hover:bg-amber-900"
          disabled={!!busy}
          onClick={() => void resetRl()}
        >
          {busy === "reset-rl" ? "Resetting…" : "Reset rate limit (server)"}
        </button>
      </div>
      {burstNote ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{burstNote}</p>
      ) : null}
    </div>
  );
}
