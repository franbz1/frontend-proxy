"use client";

export function UpgradeModal({
  open,
  planIsFree,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  planIsFree: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-600 dark:bg-zinc-900">
        <h2
          id="upgrade-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Cuota mensual agotada
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Has alcanzado el límite de tokens de tu plan para este mes.{" "}
          {planIsFree
            ? "Puedes simular un pago para pasar a PRO."
            : "En esta demo no hay upgrade desde PRO; prueba otro usuario o espera al siguiente ciclo."}
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cerrar
          </button>
          {planIsFree && (
            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Procesando…" : "Pagar y pasar a PRO (simulación)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
