"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getQuotaHistory,
  getQuotaStatus,
  postGenerate,
  postUpgrade,
} from "@/lib/api/client";
import type { DailyUsageHistoryResponse, QuotaStatusResponse } from "@/lib/types/quota";
import { ApiRequestError } from "@/lib/types/quota";
import { estimateTotalTokensForPrompt, getFixedOutputTokens } from "@/lib/token-estimate";
import { useBlockedCooldown } from "@/hooks/useBlockedCooldown";
import { QuotaPanel } from "@/components/QuotaPanel";
import { UsageChart } from "@/components/UsageChart";
import { UserSwitcher } from "@/components/UserSwitcher";
import { ChatThread, type ChatMessage } from "@/components/ChatThread";
import { UpgradeModal } from "@/components/UpgradeModal";

const STORAGE_KEY = "ai-proxy-user-id";
const DEFAULT_USER = "demo-free";

export default function Dashboard() {
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [quota, setQuota] = useState<QuotaStatusResponse | null>(null);
  const [history, setHistory] = useState<DailyUsageHistoryResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [blockedUntilMs, setBlockedUntilMs] = useState<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setUserId(stored);
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const refreshQuota = useCallback(async () => {
    await Promise.resolve();
    setLoadError(null);
    try {
      const [status, hist] = await Promise.all([
        getQuotaStatus(userId),
        getQuotaHistory(userId),
      ]);
      setQuota(status);
      setHistory(hist);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Error al cargar datos";
      setLoadError(msg);
    }
  }, [userId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void refreshQuota();
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshQuota]);

  const onUnblock = useCallback(() => {
    setBlockedUntilMs(null);
    void refreshQuota();
  }, [refreshQuota]);

  const rateLimitSecondsLeft = useBlockedCooldown(blockedUntilMs, onUnblock);

  const handleUserChange = (id: string) => {
    setUserId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setMessages([]);
    setInput("");
    setBlockedUntilMs(null);
    setUpgradeOpen(false);
  };

  const estimatedTokens = useMemo(
    () => estimateTotalTokensForPrompt(input),
    [input]
  );

  const sendDisabled =
    rateLimitSecondsLeft > 0 ||
    sending ||
    !input.trim() ||
    (quota?.tokensRemainingThisMonth === 0);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || sending || rateLimitSecondsLeft > 0) return;

    setSending(true);
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");

    try {
      const res = await postGenerate(userId, prompt);
      setQuota(res.quotaStatus);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.text },
      ]);
      const hist = await getQuotaHistory(userId);
      setHistory(hist);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.status === 429) {
          const sec = e.retryAfterSeconds ?? 60;
          setBlockedUntilMs(Date.now() + sec * 1000);
          setInput(prompt);
          return;
        }
        if (e.status === 402) {
          setUpgradeOpen(true);
          setInput(prompt);
          return;
        }
      }
      setMessages((m) => m.slice(0, -1));
      const msg =
        e instanceof Error ? e.message : "Error al generar";
      setLoadError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleUpgradeConfirm = async () => {
    if (!quota || quota.plan !== "FREE") return;
    setUpgradeLoading(true);
    setUpgradeError(null);
    try {
      await postUpgrade(userId, true, "mock-card");
      setUpgradeOpen(false);
      await refreshQuota();
      const hist = await getQuotaHistory(userId);
      setHistory(hist);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Error en el pago simulado";
      setUpgradeError(msg);
    } finally {
      setUpgradeLoading(false);
    }
  };

  const estimatorLine = (
    <>
      Estimación de esta petición:{" "}
      <span className="font-mono text-zinc-700 dark:text-zinc-300">
        ~{estimatedTokens > 0 ? estimatedTokens : 0} tokens
      </span>{" "}
      (entrada ~max(1, ⌈caracteres/4⌉) + salida fija {getFixedOutputTokens()})
    </>
  );

  const rateLimitLine =
    rateLimitSecondsLeft > 0 ? (
      <p className="mb-2 text-sm text-amber-700 dark:text-amber-400">
        Límite de solicitudes por minuto: espera{" "}
        <span className="font-mono font-semibold">{rateLimitSecondsLeft}</span>{" "}
        s para volver a enviar.
      </p>
    ) : null;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:flex-row md:p-8">
      <aside className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
        <UserSwitcher userId={userId} onChange={handleUserChange} />
        <QuotaPanel status={quota} />
        {history && <UsageChart days={history.days} />}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {quota &&
          quota.tokensRemainingThisMonth === 0 &&
          quota.plan === "FREE" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
              Has agotado los tokens del plan gratuito.{" "}
              <button
                type="button"
                className="font-medium underline hover:no-underline"
                onClick={() => {
                  setUpgradeError(null);
                  setUpgradeOpen(true);
                }}
              >
                Simular pago y pasar a PRO
              </button>
            </div>
          )}
        {quota &&
          quota.tokensRemainingThisMonth === 0 &&
          quota.plan === "PRO" && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              Cuota mensual agotada en PRO. En esta demo no hay upgrade adicional.
            </div>
          )}
        {loadError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/80 dark:text-red-200"
            role="alert"
          >
            {loadError}
          </div>
        )}
        <ChatThread
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          disabled={sendDisabled}
          sending={sending}
          estimatorLine={estimatorLine}
          rateLimitLine={rateLimitLine}
        />
      </main>

      <UpgradeModal
        open={upgradeOpen}
        planIsFree={quota?.plan === "FREE"}
        loading={upgradeLoading}
        error={upgradeError}
        onClose={() => {
          setUpgradeOpen(false);
          setUpgradeError(null);
        }}
        onConfirm={handleUpgradeConfirm}
      />
    </div>
  );
}
