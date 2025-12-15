import { LucideIcon } from 'lucide-react';

export type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'BTC' | 'ETH';

export type AssetType = 'CRYPTO' | 'STOCK';

export type TimeRange = '1H' | '1D' | '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'MAX';

export interface Asset {
  symbol: string;
  name: string;
  type?: AssetType; // Optional for backward compatibility, defaults to CRYPTO if undefined
  isFavorite?: boolean;
}

export interface StageConfig {
  id: number;
  name: string;
  action: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

export interface Pivots {
  s1: number;
  r1: number;
}

export interface TimeframeAnalysis {
  price: number;
  ma20: number | null;
  rsi: number; // New RSI field
  stage: StageConfig;
  pivots: Pivots;
}

export interface MarketData {
  daily: TimeframeAnalysis;
  weekly: TimeframeAnalysis | null;
  monthly: TimeframeAnalysis | null;
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  isCrypto: boolean;
}