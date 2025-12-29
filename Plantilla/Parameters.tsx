import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Asset, StageConfig, CurrencyConfig, CurrencyCode } from '../types';
import { GoogleGenAI } from "@google/genai";
import { obfuscate, deobfuscate } from './Cypto';

// --- SYSTEM CONFIG ---
export const AUTHORIZED_DOMAIN = 'hello.tligent.com';
const SHEET_ID = '1wJkM8rmiXCrnB0K4h9jtme0m7f5I3y1j1PX5nmEaTII';
// URL para la pestaña "Acciones" con bypass de caché
export const ASSETS_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Acciones&t=${Date.now()}`;

export const ALLOWED_IPS = ['79.112.85.173', '37.223.15.63'];

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

// --- ACTIVOS DE FALLBACK ---
export const FALLBACK_CRYPTOS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO' },
  { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO' },
  { symbol: 'SOL', name: 'Solana', type: 'CRYPTO' },
];

export const FALLBACK_STOCKS: Asset[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'STOCK' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', type: 'STOCK' },
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

// --- MOTOR DE PARSEO DE CSV PARA IDENTIFICACIÓN POR TICKER ---

const parseCSVLine = (line: string): string[] => {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else current += char;
  }
  columns.push(current.trim());
  return columns.map(col => col.replace(/^"|"$/g, '').trim());
};

export const fetchRemoteAssets = async (): Promise<{ all: Asset[], success: boolean }> => {
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(ASSETS_CSV_URL)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Net Error');
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (rows.length < 2) return { all: [], success: false };

    const headers = parseCSVLine(rows[0]).map(h => h.toLowerCase());
    const tickerIdx = headers.findIndex(h => h.includes('ticker') || h.includes('símbolo') || h.includes('symbol'));
    const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('name'));
    const typeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('type'));

    const allAssets: Asset[] = [];

    rows.slice(1).forEach(row => {
      const cols = parseCSVLine(row);
      const symbol = cols[tickerIdx !== -1 ? tickerIdx : 0]?.toUpperCase();
      const name = cols[nameIdx !== -1 ? nameIdx : 1];
      const typeStr = cols[typeIdx !== -1 ? typeIdx : 2]?.toUpperCase();

      if (symbol && name) {
        const isStock = ['STOCK', 'ACCION', 'BOLSA', 'YAHOO'].some(t => typeStr?.includes(t));
        allAssets.push({ 
          symbol, 
          name, 
          type: isStock ? 'STOCK' : 'CRYPTO' 
        });
      }
    });

    return { all: allAssets, success: allAssets.length > 0 };
  } catch (error) {
    console.warn("Sync fallido: Usando base local.");
    return { all: [], success: false };
  }
};

export const crypto = { obfuscate, deobfuscate };

export const getShortcutKey = (key: string): string | null => {
  const lowerKey = key.toLowerCase().trim();
  if (lowerKey === 'ok') {
    const secret = "NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i";
    return crypto.deobfuscate(secret, "tligent");
  } else if (lowerKey === 'cv') {
    const secret = "NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi";
    return crypto.deobfuscate(secret, "tligent");
  }
  return null;
};

export const getAllowedIps = (): string[] => {
  const saved = localStorage.getItem('criptogo_allowed_ips');
  const userIps = saved ? JSON.parse(saved) : [];
  return Array.from(new Set([...ALLOWED_IPS, ...userIps]));
};

const getAI = (key?: string) => new GoogleGenAI({ apiKey: key || process.env.API_KEY || '' });

export const askGemini = async (prompt: string, modelOverride?: string, key?: string): Promise<string> => {
  try {
    const ai = getAI(key);
    const model = modelOverride || localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text || "Sin respuesta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const validateKey = async (key?: string): Promise<boolean> => {
  const keyToTest = key || process.env.API_KEY;
  if (!keyToTest) return false;
  try {
    const ai = getAI(keyToTest);
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return !!response.text;
  } catch (err) {
    return false;
  }
};

export const listAvailableModels = async (): Promise<string[]> => {
  return ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-flash-lite-latest'];
};