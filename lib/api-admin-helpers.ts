/** Shared helpers for API Management (dashboard) — nested `exchange` vs `exchange_id` */

export type ExchangeNested = {
  id: number;
  name: string;
  price: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type ApiWithExchange = {
  exchange_id?: number;
  exchange?: ExchangeNested;
};

export function resolveApiExchangeId(api: ApiWithExchange): number | undefined {
  return api.exchange_id ?? api.exchange?.id;
}

export function getApiExchangeLabel(
  api: ApiWithExchange,
  exchanges: Array<{ id: number; name: string }>,
): string {
  const nested = api.exchange?.name?.trim();
  if (nested) return nested;
  const id = resolveApiExchangeId(api);
  if (id === undefined) return "Unknown";
  return exchanges.find((e) => e.id === id)?.name ?? "Unknown";
}
