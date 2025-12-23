
export const APP_VERSION = 'v25.12AB';

import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Shield, 
  Target, 
  Zap, 
  BrainCircuit, 
  HelpCircle 
} from 'lucide-react';
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
  1: { 
    id: 1, 
    name: 'Acumul.', 
    action: 'VIGILAR', 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-50 border-emerald-100', 
    icon: Minus 
  },
  2: { 
    id: 2, 
    name: 'Alcista', 
    action: 'COMPRAR', 
    color: 'text-emerald-900', 
    bg: 'bg-emerald-200 border-emerald-300', 
    icon: TrendingUp 
  },
  3: { 
    id: 3, 
    name: 'Distrib.', 
    action: 'ESPERAR', 
    color: 'text-orange-500', 
    bg: 'bg-orange-50 border-orange-100', 
    icon: Activity 
  },
  4: { 
    id: 4, 
    name: 'Bajista', 
    action: 'VENDER', 
    color: 'text-red-600', 
    bg: 'bg-red-50 border-red-100', 
    icon: TrendingDown 
  },
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar', isCrypto: false },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', isCrypto: false },
  JPY: { code: 'JPY', symbol: '¥', name: 'Yen', isCrypto: false },
  BTC: { code: 'BTC', symbol: '₿', name: 'Bitcoin', isCrypto: true },
  ETH: { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', isCrypto: true },
};

// --- GUIA DATA ---

export const INITIAL_TOOLS = [
  { 
    emoji: '🔑', 
    title: 'Wallets', 
    id: 'tools-wallets', 
    desc: 'Tu identidad y banco de autocustodia digital.', 
    links: [
      { name: 'MetaMask', url: 'https://metamask.io/' }, 
      { name: 'Rabby', url: 'https://rabby.io/' },
      { name: 'Trust Wallet', url: 'https://trustwallet.com/' }
    ] 
  },
  { 
    emoji: '🔄', 
    title: 'DEXs', 
    id: 'tools-dexs', 
    desc: 'Intercambios descentralizados sin intermediarios.', 
    links: [
      { name: 'Uniswap', url: 'https://uniswap.org/' }, 
      { name: 'Curve', url: 'https://curve.fi/' }
    ] 
  },
  { 
    emoji: '💰', 
    title: 'Lending', 
    id: 'tools-lending', 
    desc: 'Protocolos de préstamo y generación de interés colateral.', 
    links: [
      { name: 'Aave', url: 'https://aave.com/' }, 
      { name: 'Compound', url: 'https://compound.finance/' }
    ] 
  },
  { 
    emoji: '📊', 
    title: 'Agregadores', 
    id: 'tools-aggregators', 
    desc: 'Optimizadores de rutas para mejores rendimientos.', 
    links: [
      { name: '1inch', url: 'https://1inch.io/' }, 
      { name: 'Krystal', url: 'https://defi.krystal.app/' }
    ] 
  }
];

export const INITIAL_PLATFORMS = [
  { 
    emoji: '🏛️', 
    title: 'TradFi', 
    id: 'platforms-traditional', 
    desc: 'Análisis macroeconómico y mercados tradicionales.', 
    links: [
      { name: 'TradingView', url: 'https://www.tradingview.com/' }, 
      { name: 'Investing', url: 'https://www.investing.com/' }
    ] 
  },
  { 
    emoji: '🪙', 
    title: 'Data Agg', 
    id: 'platforms-aggregators', 
    desc: 'Enciclopedia de métricas y precios crypto en tiempo real.', 
    links: [
      { name: 'DefiLlama', url: 'https://defillama.com/' }, 
      { name: 'CoinGecko', url: 'https://www.coingecko.com/' }
    ] 
  },
  { 
    emoji: '🔗', 
    title: 'On-Chain', 
    id: 'platforms-onchain', 
    desc: 'Análisis de ballenas, flujos de red y actividad real.', 
    links: [
      { name: 'Dune', url: 'https://dune.com/' }, 
      { name: 'Nansen', url: 'https://www.nansen.ai/' }
    ] 
  },
  { 
    emoji: '🔎', 
    title: 'Explorers', 
    id: 'platforms-explorers', 
    desc: 'Verificación de contratos y auditoría de transacciones.', 
    links: [
      { name: 'Etherscan', url: 'https://etherscan.io/' }, 
      { name: 'Solscan', url: 'https://solscan.io/' }
    ] 
  }
];

export const MODAL_CONTENT = {
  q1: { 
    id: "q1", 
    title: "Cuadrante 1: Fundamentos", 
    icon: Shield, 
    color: "text-emerald-600", 
    body: "Lending o Staking con stablecoins para preservar capital.", 
    prompt: "Explica el Cuadrante 1 de DeFi (Fundamentos). INSTRUCCIONES: Usa texto normal. PROHIBIDO usar negritas Unicode (góticas). Usa solo caracteres estándar." 
  },
  q2: { 
    id: "q2", 
    title: "Cuadrante 2: Estrategas", 
    icon: Target, 
    color: "text-blue-600", 
    body: "Staking de activos volátiles (ETH/SOL) y liquidez estable.", 
    prompt: "Explica el Cuadrante 2 de DeFi (Estrategas). INSTRUCCIONES: Usa texto normal. PROHIBIDO usar negritas Unicode (góticas). Usa solo caracteres estándar." 
  },
  q3: { 
    id: "q3", 
    title: "Cuadrante 3: Oportunistas", 
    icon: Zap, 
    color: "text-orange-600", 
    body: "Rentabilidades altas a cambio de Impermanent Loss.", 
    prompt: "Explica el Cuadrante 3 de DeFi (Oportunistas). INSTRUCCIONES: Usa texto normal. PROHIBIDO usar negritas Unicode (góticas). Usa solo caracteres estándar." 
  },
  q4: { 
    id: "q4", 
    title: "Cuadrante 4: Expertos", 
    icon: BrainCircuit, 
    color: "text-red-600", 
    body: "Yield Farming apalancado, derivados y opciones.", 
    prompt: "Explica el Cuadrante 4 de DeFi (Expertos). INSTRUCCIONES: Usa texto normal. PROHIBIDO usar negritas Unicode (góticas). Usa solo caracteres estándar." 
  }
};

export const GEMINI_LABS = [
  { 
    id: 'strategy', 
    title: 'Generador de Estrategias DeFi con IA', 
    icon: Target, 
    desc: 'Sugerencia de inversión educativa por Gemini.', 
    inputs: [
      { id: 'risk', type: 'select', label: 'Riesgo', options: ['Conservador', 'Moderado', 'Agresivo'] }, 
      { id: 'cap', type: 'number', label: 'Capital (USD)', placeholder: 'Ej: 5000' }
    ], 
    buttonText: 'Generar', 
    prompt: 'Actúa como estratega DeFi. Plan para perfil {risk} con ${cap}. INSTRUCCIONES: Usa texto normal legible. No uses caracteres Unicode especiales.' 
  },
  { 
    id: 'risk', 
    title: 'Análisis de Protocolos con IA', 
    icon: Shield, 
    desc: 'Análisis de riesgo instantáneo por Gemini.', 
    inputs: [
      { id: 'prot', type: 'text', label: '', placeholder: 'Protocolo (ej: Aave)...' }
    ], 
    buttonText: 'Analizar', 
    prompt: 'Analiza el protocolo {prot}. INSTRUCCIONES: Usa texto normal legible. No uses caracteres Unicode especiales.' 
  },
  { 
    id: 'eli5', 
    title: 'Diccionario DeFi con IA', 
    icon: HelpCircle, 
    desc: 'Explicaciones sencillas de términos complejos.', 
    inputs: [
      { id: 'term', type: 'text', label: '', placeholder: 'Término (ej: MEV)...' }
    ], 
    buttonText: 'Explicar', 
    prompt: 'Explica {term} para un niño de 5 años. INSTRUCCIONES: Usa texto normal legible. No uses caracteres Unicode especiales.' 
  }
];
