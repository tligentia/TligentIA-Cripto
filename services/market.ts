import { STAGES } from '../constants';
import { MarketData, TimeframeAnalysis, Asset, CurrencyCode, AssetType, TimeRange } from '../types';

// --- CONFIGURACIÓN DE ENDPOINTS ---
const BINANCE_HOSTS = [
  'https://api.binance.com/api/v3',
  'https://data-api.binance.vision/api/v3'
];
const YAHOO_BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart';

// --- SISTEMA DE CACHÉ DE MEMORIA (Volátil por sesión) ---
const marketCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 segundos de frescura total

// --- OPTIMIZADOR DE PROXIES ---
let preferredProxyIdx = 0;

const fetchWithProxy = async (targetUrl: string): Promise<any> => {
    const cacheKey = `fetch_${targetUrl}`;
    const cached = marketCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) return cached.data;

    const proxies = [
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
        (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    // Intentar primero con el proxy que funcionó la última vez
    const orderedProxies = [...proxies];
    const first = orderedProxies.splice(preferredProxyIdx, 1)[0];
    orderedProxies.unshift(first);

    for (let i = 0; i < orderedProxies.length; i++) {
        try {
            const url = orderedProxies[i](targetUrl);
            const res = await fetch(url, { 
                cache: 'no-store',
                signal: AbortSignal.timeout(5000) // Timeout agresivo para saltar proxies lentos
            });
            if (!res.ok) continue;
            
            let data = await res.json();
            // AllOrigins envuelve el contenido en .contents
            if (data.contents) {
                try { data = JSON.parse(data.contents); } catch { continue; }
            }

            if (data) {
                preferredProxyIdx = i; // Guardar éxito para la próxima
                marketCache.set(cacheKey, { data, timestamp: Date.now() });
                return data;
            }
        } catch (e) {
            continue;
        }
    }
    throw new Error('Red saturada');
};

// --- ANÁLISIS TÉCNICO ---
const calculateMA = (closes: number[], period = 20): number | null => {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const calculateRSI = (closes: number[], period = 14): number => {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff > 0) gains += diff; else losses += Math.abs(diff);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    }
    return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
};

const analyzeTimeframeSeries = (candles: any[]): TimeframeAnalysis | null => {
  if (!Array.isArray(candles) || candles.length === 0) return null;
  const closes = candles.map(c => parseFloat(c[4]));
  const current = closes[closes.length - 1];
  const hasMA = closes.length >= 21;
  const ma20 = hasMA ? calculateMA(closes, 20) : current;
  const prevMa20 = hasMA ? calculateMA(closes.slice(0, -1), 20) : current;
  
  const slope = (ma20 || 0) - (prevMa20 || 0);
  const threshold = (ma20 || 0) * 0.0005;
  let stageId = 1;
  if (ma20) {
      if (slope > threshold && current > ma20) stageId = 2;
      else if (slope < -threshold && current < ma20) stageId = 4;
      else if (Math.abs(slope) < threshold) stageId = 1;
      else stageId = 3;
  }

  const prev = candles.length >= 2 ? candles[candles.length - 2] : candles[0];
  const pp = (parseFloat(prev[2]) + parseFloat(prev[3]) + parseFloat(prev[4])) / 3;
  
  return { 
    price: current, 
    ma20, 
    rsi: calculateRSI(closes), 
    stage: STAGES[stageId], 
    pivots: { s1: (2 * pp) - parseFloat(prev[2]), r1: (2 * pp) - parseFloat(prev[3]) } 
  };
};

export const fetchAssetData = async (symbol: string, type: AssetType = 'CRYPTO'): Promise<MarketData> => {
    const cacheKey = `market_data_${symbol}_${type}`;
    const cached = marketCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) return cached.data;

    if (type === 'STOCK') {
        const encoded = encodeURIComponent(symbol);
        const [d, w, m] = await Promise.all([
            fetchYahooFrame(symbol, '1d', '6mo'),
            fetchYahooFrame(symbol, '1wk', '2y'),
            fetchYahooFrame(symbol, '1mo', '5y')
        ]);
        const res = { daily: analyzeTimeframeSeries(d)!, weekly: analyzeTimeframeSeries(w), monthly: analyzeTimeframeSeries(m) };
        marketCache.set(cacheKey, { data: res, timestamp: Date.now() });
        return res;
    } else {
        const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
        const fetchB = (int: string) => fetchWithProxy(`${BINANCE_HOSTS[0]}/klines?symbol=${pair}&interval=${int}&limit=60`);
        const [d, w, m] = await Promise.all([fetchB('1d'), fetchB('1w'), fetchB('1M')]);
        const res = { daily: analyzeTimeframeSeries(d)!, weekly: analyzeTimeframeSeries(w), monthly: analyzeTimeframeSeries(m) };
        marketCache.set(cacheKey, { data: res, timestamp: Date.now() });
        return res;
    }
};

async function fetchYahooFrame(symbol: string, interval: string, range: string) {
    const encoded = encodeURIComponent(symbol);
    const url = `${YAHOO_BASE_URL}/${encoded}?interval=${interval}&range=${range}&includeAdjustedClose=true`;
    const json = await fetchWithProxy(url);
    const result = json?.chart?.result?.[0];
    const quotes = result?.indicators?.quote?.[0];
    const ts = result?.timestamp;
    if (!quotes || !ts) return [];
    return ts.map((t: number, i: number) => [t * 1000, 0, quotes.high[i], quotes.low[i], quotes.close[i], 0]);
}

export const fetchHistoricalSeries = async (symbol: string, type: AssetType, range: TimeRange | number) => {
    if (type === 'STOCK') {
        let yRange = '1mo', yInterval = '1d';
        if (typeof range === 'string') {
            const map: any = { '1H': ['1d', '5m'], '1D': ['5d', '15m'], '1W': ['1mo', '1h'], '1M': ['1mo', '1d'], '1Y': ['1y', '1wk'] };
            [yRange, yInterval] = map[range] || ['1mo', '1d'];
        }
        const data = await fetchYahooFrame(symbol, yInterval, yRange);
        return data.map((c: any) => ({ time: c[0], close: c[4] }));
    } else {
        const pair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
        let bInt = '1d', bLim = 60;
        if (typeof range === 'string') {
            const map: any = { '1H': ['5m', 12], '1D': ['30m', 48], '1W': ['4h', 42], '1M': ['1d', 30] };
            [bInt, bLim] = map[range] || ['1d', 30];
        } else bLim = range;
        const data = await fetchWithProxy(`${BINANCE_HOSTS[0]}/klines?symbol=${pair}&interval=${bInt}&limit=${bLim}`);
        return data.map((c: any) => ({ time: c[0], close: parseFloat(c[4]) }));
    }
};

export const resolveAsset = async (input: string): Promise<Asset | null> => {
  const clean = input.toUpperCase().trim();
  try {
      await fetchWithProxy(`${BINANCE_HOSTS[0]}/ticker/price?symbol=${clean}${clean.endsWith('USDT') ? '' : 'USDT'}`);
      return { symbol: clean, name: clean, type: 'CRYPTO' };
  } catch {
      return { symbol: clean, name: clean, type: 'STOCK' };
  }
};

export const fetchExchangeRates = async () => {
  try {
    const data = await fetchWithProxy('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur,jpy,btc,eth');
    return { USD: 1, EUR: data.tether.eur, JPY: data.tether.jpy, BTC: data.tether.btc, ETH: data.tether.eth };
  } catch {
    return { USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 };
  }
};