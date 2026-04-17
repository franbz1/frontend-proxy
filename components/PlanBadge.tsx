import type { Plan } from "@/lib/types/quota";

const planStyles: Record<Plan, string> = {
  FREE:
    "bg-slate-200 text-slate-800 ring-1 ring-slate-400/60 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-500",
  PRO: "bg-violet-600 text-white ring-1 ring-violet-500/80",
  ENTERPRISE:
    "bg-amber-500 text-zinc-900 ring-1 ring-amber-600/80 font-semibold",
  DEMO_THROTTLED:
    "bg-orange-600 text-white ring-1 ring-orange-500/80 font-medium",
};

const planLabels: Record<Plan, string> = {
  FREE: "FREE",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
  DEMO_THROTTLED: "DEMO (RPM)",
};

export function PlanBadge({ plan }: { plan: Plan | string }) {
  const key = plan in planStyles ? (plan as Plan) : null;
  const style =
    key != null
      ? planStyles[key]
      : "bg-zinc-500 text-white ring-1 ring-zinc-400/80";
  const label = key != null ? planLabels[key] : plan;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
