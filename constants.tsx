import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Asset, StageConfig, CurrencyConfig, CurrencyCode } from './types';

export const COLORS = {
  bg: 'bg-gray-50',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-600',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-gray-800 text-white',
  btnDanger: 'text-red-600 hover:bg-red-50',
  btnAi: 'bg-indigo-600 hover:bg-indigo-700 text-white', 
  btnProfiles: 'bg-slate-700 hover:bg-slate-800 text-white',
  btnChart: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300',
  aiBg: 'bg-indigo-50',
  aiText: 'text-indigo-950',
  aiBorder: 'border-indigo-100'
};

export const DEFAULT_ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'SOL', name: 'Solana', type: 'CRYPTO' },
  { symbol: 'XRP', name: 'Ripple', type: 'CRYPTO' },
  { symbol: 'BNB', name: 'Binance Coin', type: 'CRYPTO' },
  { symbol: 'AAVE', name: 'Aave', type: 'CRYPTO' },
  { symbol: 'JUP', name: 'Jupiter', type: 'CRYPTO' },
  { symbol: 'ZEC', name: 'ZCash', type: 'CRYPTO' },
  { symbol: 'UNI', name: 'Uniswap', type: 'CRYPTO' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'CRYPTO' },
];

export const TOP_STOCKS: Asset[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'STOCK' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'STOCK' },
  { symbol: 'AAPL', name: 'Apple Inc', type: 'STOCK' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'STOCK' },
  { symbol: 'AMZN', name: 'Amazon', type: 'STOCK' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)', type: 'STOCK' },
  { symbol: 'META', name: 'Meta Platforms', type: 'STOCK' },
  { symbol: 'TSLA', name: 'Tesla Inc', type: 'STOCK' },
];

export const STAGES: Record<number, StageConfig> = {
  1: { id: 1, name: 'Acumulación', action: 'VIGILAR', color: 'text-gray-500', bg: 'bg-gray-100', icon: Minus },
  2: { id: 2, name: 'Alcista', action: 'COMPRAR', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: TrendingUp },
  3: { id: 3, name: 'Distribución', action: 'ESPERAR', color: 'text-orange-600', bg: 'bg-orange-50', icon: Activity },
  4: { id: 4, name: 'Bajista', action: 'VENDER', color: 'text-red-700', bg: 'bg-red-50', icon: TrendingDown },
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar', isCrypto: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', isCrypto: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen', isCrypto: false },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', isCrypto: true },
  ETH: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', isCrypto: true },
};