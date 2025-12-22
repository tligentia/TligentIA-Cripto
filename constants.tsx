
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Asset, StageConfig, CurrencyConfig, CurrencyCode } from './types';

export const COLORS = {
  bg: 'bg-white',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-500',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-black text-white',
  btnDanger: 'text-red-600 hover:bg-red-50',
  btnAi: 'bg-gray-900 hover:bg-black text-white', 
  btnProfiles: 'bg-gray-700 hover:bg-gray-800 text-white',
  btnChart: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200',
  aiBg: 'bg-gray-50',
  aiText: 'text-gray-900',
  aiBorder: 'border-gray-200'
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
  1: { id: 1, name: 'Acumul.', action: 'VIGILAR', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100', icon: Minus },
  2: { id: 2, name: 'Alcista', action: 'COMPRAR', color: 'text-emerald-900', bg: 'bg-emerald-200 border-emerald-300', icon: TrendingUp },
  3: { id: 3, name: 'Distrib.', action: 'ESPERAR', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100', icon: Activity },
  4: { id: 4, name: 'Bajista', action: 'VENDER', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: TrendingDown },
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar', isCrypto: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', isCrypto: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen', isCrypto: false },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', isCrypto: true },
  ETH: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', isCrypto: true },
};
