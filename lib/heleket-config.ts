export const HELEKET_PAYMENT_TYPE_NAME = "Heleket";
export const HELEKET_API_URL = "https://api.heleket.com/v1";
export const HELEKET_MERCHANT_URL = "https://heleket.com/ru";
export const HELEKET_SUPPORT_URL = "https://heleket.com/ru/support";

const FALLBACK_API_BASE = "https://api.originalsmm.uz/api";

export function getHeleketCallbackUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || FALLBACK_API_BASE).replace(/\/+$/, "");
  return `${base}/heleket/callback/`;
}

export const HELEKET_CURRENCIES = [
  { name: "Tether (ERC-20)", symbol: "USDT" },
  { name: "Tether (TRC-20)", symbol: "USDT" },
  { name: "Bitcoin", symbol: "BTC" },
  { name: "Ethereum", symbol: "ETH" },
  { name: "Litecoin", symbol: "LTC" },
  { name: "TRON", symbol: "TRX" },
] as const;
