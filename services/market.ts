import { STAGES } from '../constants';
import { MarketData, TimeframeAnalysis, Asset, CurrencyCode, AssetType } from '../types';

// --- CONFIGURATION ---

const BINANCE_HOSTS = [
  'https://data-api.binance.vision/api/v3', // Primary: Reliable, public data
  'https://api.binance.com/api/v3'          // Fallback: Standard endpoint
];

const YAHOO_BASE_URL = 'https://query2.finance.yahoo.com/v8/finance/chart';

// --- PROXY UTILS ---

/**
 * Tries to fetch a URL using multiple CORS proxies to ensure reliability.
 * Includes validation to ensure the proxy didn't return a "Success" 200 OK 
 * with an empty or error body from the target (soft failure).
 */
const fetchWithProxy = async (targetUrl: string): Promise<any> => {
    const proxies = [
        // Strategy 1: AllOrigins (JSON Wrapper) - Highest reliability for text/json
        {
            name: 'AllOrigins',
            url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
            extract: (json: any) => {
                if (json.contents) {
                    try { return JSON.parse(json.contents); } catch(e) { return null; }
                }
                return null;
            }
        },
        // Strategy 2: CorsProxy.io (Direct)
        {
            name: 'CorsProxy',
            url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            extract: (json: any) => json
        },
        // Strategy 3: CodeTabs (Direct) - Good fallback but strict rate limits
        {
            name: 'CodeTabs',
            url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
            extract: (json: any) => json
        }
    ];

    for (const p of proxies) {
        try {
            const res = await fetch(p.url(targetUrl));
            if (!res.ok) continue;
            
            const rawJson = await res.json();
            const data = p.extract(rawJson);
            
            // Validate specific to Yahoo structure to ensure we didn't get a soft-error
            // If data is null or doesn't have chart result, try next proxy
            if (data?.chart?.result?.[0]?.timestamp?.length > 0) {
                return data;
            }
        } catch (e) {
            console.warn(`Proxy ${p.name} failed or returned invalid data, trying next...`);
        }
    }
    throw new Error('Unable to fetch valid data via any proxy. Check network or firewall.');
};

// --- TECHNICAL ANALYSIS UTILS ---

const calculateMA = (closes: number[], period = 20): number | null => {
  if (closes.length < period) return null;
  const slice = closes.slice(closes.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
};

// Standard RSI Calculation (14 periods)
const calculateRSI = (closes: number[], period = 14): number => {
    if (closes.length < period + 1) return 50; // Not enough data, return neutral

    let gains = 0;
    let losses = 0;

    // 1. First Average Gain/Loss
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // 2. Smoothed averages for the rest of the data
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

const determineCriptoGoStage = (price: number, ma20: number, prevMa20: number): number => {
  const slope = ma20 - prevMa20;
  const slopeThreshold = ma20 * 0.0005;

  if (slope > slopeThreshold && price > ma20) return 2; // Alcista
  if (slope < -slopeThreshold && price < ma20) return 4; // Bajista
  if (Math.abs(slope) < slopeThreshold) return 1; // Acumulación
  
  return 3; // Distribución
};

const calculatePivots = (high: number, low: number, close: number) => {
  const pp = (high + low + close) / 3;
  const s1 = (2 * pp) - high;
  const r1 = (2 * pp) - low;
  return { s1, r1 };
};

/**
 * Generic analysis function that takes standard OHLC arrays
 * Format expected: [ [time, open, high, low, close, volume], ... ]
 * Values can be strings (Binance) or numbers (Yahoo)
 */
const analyzeTimeframeSeries = (candlesData: any[]): TimeframeAnalysis | null => {
  if (!Array.isArray(candlesData) || candlesData.length < 25) return null;

  // Normalize closes to numbers
  const closes = candlesData.map(c => parseFloat(c[4]));
  const currentPrice = parseFloat(candlesData[candlesData.length - 1][4]);
  
  const ma20 = calculateMA(closes, 20);
  const prevMa20 = calculateMA(closes.slice(0, closes.length - 1), 20);
  const rsi = calculateRSI(closes, 14);

  if (ma20 === null || prevMa20 === null) return null;

  const stageId = determineCriptoGoStage(currentPrice, ma20, prevMa20);
  
  const prevCandle = candlesData[candlesData.length - 2];
  const pivots = calculatePivots(
      parseFloat(prevCandle[2]), // High
      parseFloat(prevCandle[3]), // Low
      parseFloat(prevCandle[4])  // Close
  );

  return {
    price: currentPrice,
    ma20,
    rsi,
    stage: STAGES[stageId],
    pivots
  };
};

// --- DATA FETCHING: BINANCE (CRYPTO) ---

const fetchWithFallback = async (endpoint: string, params: string) => {
    for (const host of BINANCE_HOSTS) {
        try {
            const url = `${host}${endpoint}?${params}`;
            const res = await fetch(url);
            if (res.ok) return await res.json();
            if (res.status === 400 || res.status === 404) {
               // If it's a client error (invalid symbol), don't try other hosts, just throw
               throw new Error('Symbol not found');
            }
        } catch (e) {
            console.warn(`Failed to fetch from ${host}, trying next fallback...`);
            continue;
        }
    }
    throw new Error('All Binance endpoints failed');
};

const fetchCryptoData = async (symbol: string): Promise<MarketData> => {
    const symbolPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
    
    // Fetch parallel (Requested 60 candles to have enough buffer for RSI and MA calculations)
    const [dData, wData, mData] = await Promise.all([
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&limit=60`),
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1w&limit=60`),
        fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1M&limit=60`)
    ]);

    const daily = analyzeTimeframeSeries(dData);
    const weekly = analyzeTimeframeSeries(wData);
    const monthly = analyzeTimeframeSeries(mData);

    if (!daily) throw new Error('Datos insuficientes (Crypto)');

    return { daily, weekly, monthly };
};

// --- DATA FETCHING: YAHOO FINANCE (STOCKS) ---

const fetchYahooData = async (symbol: string): Promise<MarketData> => {
    // Helper to fetch and parse Yahoo JSON
    const fetchYahooFrame = async (interval: string, range: string) => {
        // Add cache buster to avoid stale proxy data
        const targetUrl = `${YAHOO_BASE_URL}/${symbol}?interval=${interval}&range=${range}&events=history&includeAdjustedClose=true&_=${Date.now()}`;
        
        try {
            const json = await fetchWithProxy(targetUrl);
            
            // Robust Null Checking for Yahoo response structure
            const result = json?.chart?.result?.[0];
            if (!result) return []; // Return empty array instead of throwing to allow partial data

            const quotes = result.indicators?.quote?.[0];
            const timestamps = result.timestamp;

            if (!quotes || !timestamps || !quotes.close || quotes.close.length === 0) {
                return [];
            }

            // Map to format [time, open, high, low, close]
            // Filter out nulls (which happen on market holidays)
            const cleanData = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (timestamps[i] && quotes.open[i] != null && quotes.high[i] != null && quotes.low[i] != null && quotes.close[i] != null) {
                    cleanData.push([
                        timestamps[i] * 1000, // Time
                        quotes.open[i],       // Open
                        quotes.high[i],       // High
                        quotes.low[i],        // Low
                        quotes.close[i],      // Close
                        quotes.volume?.[i] || 0 // Volume
                    ]);
                }
            }
            return cleanData;
        } catch (e) {
            console.error(`Error fetching Yahoo frame ${interval}:`, e);
            return [];
        }
    };

    // Requested ranges increased to ensure > 25 candles even with gaps
    const [dData, wData, mData] = await Promise.all([
        fetchYahooFrame('1d', '6mo'), 
        fetchYahooFrame('1wk', '2y'),
        fetchYahooFrame('1mo', '5y')
    ]);

    const daily = analyzeTimeframeSeries(dData);
    // Weekly and Monthly are optional (can be null if fetch failed)
    const weekly = analyzeTimeframeSeries(wData);
    const monthly = analyzeTimeframeSeries(mData);

    if (!daily) throw new Error('Datos insuficientes (Stock). Mercado cerrado o error de API.');

    return { daily, weekly, monthly };
};


// --- PUBLIC FACING METHODS ---

export const fetchAssetData = async (symbol: string, type: AssetType = 'CRYPTO'): Promise<MarketData> => {
    // If we have an explicit type, use it. If not, try to infer or default to Crypto.
    if (type === 'STOCK') {
        return await fetchYahooData(symbol);
    } else {
        return await fetchCryptoData(symbol);
    }
};

// --- NEW METHOD: FETCH RAW SERIES FOR CORRELATION ---
export interface HistoryPoint {
  time: number;
  close: number;
}

export const fetchHistoricalSeries = async (symbol: string, type: AssetType, days: number): Promise<HistoryPoint[]> => {
    try {
        if (type === 'STOCK') {
            // Map days to Yahoo Range
            let range = '1mo';
            if (days <= 7) range = '5d';
            else if (days <= 31) range = '1mo';
            else if (days <= 92) range = '3mo';
            else if (days <= 366) range = '1y';
            else range = '2y';

            const targetUrl = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=${range}&events=history&includeAdjustedClose=true&_=${Date.now()}`;
            const json = await fetchWithProxy(targetUrl);
            const result = json?.chart?.result?.[0];
            
            if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) return [];

            const timestamps = result.timestamp;
            const closes = result.indicators.quote[0].close;
            const data: HistoryPoint[] = [];

            for(let i=0; i<timestamps.length; i++) {
                if(timestamps[i] && closes[i] !== null) {
                    data.push({ time: timestamps[i] * 1000, close: closes[i] });
                }
            }
            return data;

        } else {
            // Binance
            // interval 1d, limit = days
            const symbolPair = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;
            const rawData = await fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&limit=${days}`);
            
            return rawData.map((c: any) => ({
                time: c[0],
                close: parseFloat(c[4])
            }));
        }
    } catch (e) {
        console.warn(`Failed to fetch history for ${symbol}`, e);
        return [];
    }
};

// Internal helpers for resolving
const checkBinance = async (cleanInput: string): Promise<Asset | null> => {
    try {
        const symbolPair = `${cleanInput}USDT`;
        await fetchWithFallback('/klines', `symbol=${symbolPair}&interval=1d&limit=1`);
        return { symbol: cleanInput, name: cleanInput, type: 'CRYPTO' };
    } catch (e) { return null; }
};

const checkYahoo = async (cleanInput: string): Promise<Asset | null> => {
    try {
        // Check if symbol exists by requesting a small chart
        // Add cache buster
        const targetUrl = `${YAHOO_BASE_URL}/${cleanInput}?interval=1d&range=1d&_=${Date.now()}`;
        
        // Use the robust fetchWithProxy here too
        const json = await fetchWithProxy(targetUrl);
        
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta) {
            // Found it!
            // Clean up name (remove "Inc.", "Corporation", etc for display)
            const shortName = meta.shortName || meta.longName || cleanInput;
            // Remove common legal suffixes for cleaner UI
            const displayName = shortName.replace(/, Inc\.| Inc\.| Corporation| Corp\.|, L.P.| Limited/gi, '');
            return { symbol: cleanInput, name: displayName, type: 'STOCK' };
        }
    } catch (e) { /* Not a stock */ }
    return null;
};

export const resolveAsset = async (input: string, type: AssetType): Promise<Asset | null> => {
  const cleanInput = input.toUpperCase().trim();
  
  // STRICT CHECKING BASED ON SELECTED PANEL
  if (type === 'STOCK') {
      return await checkYahoo(cleanInput);
  } else {
      // Default to Crypto
      return await checkBinance(cleanInput);
  }
};

// --- EXCHANGE RATES ---

export const fetchExchangeRates = async (): Promise<Record<CurrencyCode, number>> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur,jpy,btc,eth');
    
    // Validar respuesta
    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    
    // Validar estructura antes de acceder
    if (!data || !data.tether) {
        throw new Error('Formato de respuesta CoinGecko inválido o rate limit');
    }

    const rates = data.tether;
    
    return {
      USD: 1, 
      EUR: rates.eur || 0.92,
      JPY: rates.jpy || 150,
      BTC: rates.btc || 0.000015,
      ETH: rates.eth || 0.00035
    };
  } catch (e) {
    console.warn("Error fetching rates, defaulting to USD", e);
    return { USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 };
  }
};