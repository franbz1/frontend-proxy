export interface DemoUser {
  externalId: string;
  plan: string;
  requestsPerMinute: number | null;
  monthlyTokenLimit: number | null;
  displayLabel: string;
}
