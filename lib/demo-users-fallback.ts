/** Matches tallerProxy data.sql when GET /api/demo/users is unavailable. */
export const FALLBACK_DEMO_USERS: { id: string; label: string }[] = [
  { id: "demo-free", label: "demo-free (FREE)" },
  { id: "demo-pro", label: "demo-pro (PRO)" },
  { id: "demo-enterprise", label: "demo-enterprise (ENTERPRISE)" },
  { id: "demo-rate-limit", label: "demo-rate-limit (DEMO_THROTTLED)" },
  { id: "demo-near-quota", label: "demo-near-quota (FREE)" },
];
