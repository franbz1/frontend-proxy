"use client";

import type { QuotaStatusResponse } from "@/lib/types/quota";
import { PlanBadge } from "@/components/PlanBadge";
import { useCountdownTo } from "@/hooks/useCountdownTo";

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuotaPanel({ status }: { status: QuotaStatusResponse | null }) {
  const resetSeconds = useCountdownTo(status?.rateLimit.rateLimitResetAt ?? null);

  if (!status) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/80">
        <p className="text-sm text-zinc-500">Cargando cuota…</p>
      </div>
    );
  }

  const limit = status.monthlyTokenLimit;
  const used = status.tokensUsedThisMonth;
  const unlimited = limit === null || status.tokensRemainingThisMonth === null;
  const pct =
    unlimited || !limit ? 0 : Math.min(100, Math.round((used / limit) * 100));

  const rl = status.rateLimit;
  const rpmUnlimited = rl.requestsLimitPerMinute === null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Plan actual
        </span>
        <PlanBadge plan={status.plan} />
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>Tokens este mes</span>
          {unlimited ? (
            <span>Ilimitado</span>
          ) : (
            <span>
              {used.toLocaleString("es")} / {limit!.toLocaleString("es")} (
              {status.tokensRemainingThisMonth!.toLocaleString("es")} restantes)
            </span>
          )}
        </div>
        {unlimited ? (
          <p className="text-xs text-zinc-500">
            Tu plan no aplica tope mensual de tokens.
          </p>
        ) : (
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 dark:bg-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <div className="mb-1 flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>Solicitudes este minuto</span>
          {rpmUnlimited ? (
            <span>Sin tope práctico</span>
          ) : (
            <span>
              {rl.requestsUsedThisWindow} / {rl.requestsLimitPerMinute}
            </span>
          )}
        </div>
        {!rpmUnlimited && resetSeconds !== null && (
          <p className="text-xs text-zinc-500">
            Reinicio de ventana en{" "}
            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {formatSeconds(resetSeconds)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
