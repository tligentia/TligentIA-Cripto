
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Search, RefreshCw, ArrowRightLeft, Info, BarChart3, Loader2, AlertCircle, Layers, ChevronDown, ChevronUp, Droplets, Target, Calculator, MousePointerClick, ArrowUpDown, ShieldCheck, Zap, AlertTriangle, Flame, ExternalLink } from 'lucide-react';
import { fetchHistoricalSeries, HistoryPoint } from '../services/market';
import { CURRENCIES, TOP_STOCKS } from '../constants';
import { Asset } from '../types';
import PearsonModal from './PearsonModal';
import StrategyModal from './StrategyModal';
// Import GoogleGenAI SDK
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURACIÓN & UTILIDADES ---

const STABLE_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', type: 'stable', category: 'Stablecoin' },
  { symbol: 'USDT', name: 'Tether', type: 'stable', category: 'Stablecoin' },
];

const TIMEFRAMES = [
  { label: 'Semana', fullLabel: '1 Semana', days: 7 },
  { label: 'Mes', fullLabel: '1 Mes', days: 30 },
  { label: '3 Meses', fullLabel: '3 Meses', days: 90 },
  { label: 'Año', fullLabel: '1 Año', days: 365 },
];

// Helper to create date key YYYY-MM-DD
const getDateKey = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Cálculo de Coeficiente de Pearson sobre arrays alineados
const calculatePearsonCorrelation = (arrX: number[], arrY: number[]) => {
  const n = arrX.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = arrX[i];
    const y = arrY[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
};

// --- SUB-COMPONENTS ---

const AssetSelect = ({ 
    label, 
    selected, 
    onSelect,
    cryptoList,
    stockList,
    stableList
}: { 
    label: string, 
    selected: any, 
    onSelect: (a: any) => void,
    cryptoList: any[],
    stockList: any[],
    stableList: any[]
}) => (
  <div className="flex flex-col gap-0.5 w-full">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select 
        className="w-full py-1.5 pl-2 pr-6 border border-gray-300 rounded bg-white text-sm font-semibold text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none shadow-sm appearance-none"
        value={selected.symbol}
        onChange={(e) => {
           const all = [...stableList, ...cryptoList, ...stockList];
           const found = all.find(a => a.symbol === e.target.value);
           if (found) onSelect(found);
        }}
      >
        <optgroup label="Monedas Base (Stables)">
          {stableList.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
        </optgroup>
        <optgroup label="Cripto Activos">
          {cryptoList.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</option>)}
        </optgroup>
        <optgroup label="Bolsa (Stock Market)">
          {stockList.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
        </optgroup>
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  </div>
);

const CorrelationBadge = ({ value, onClick }: { value: number | null, onClick: () => void }) => {
  if (value === null) return <div className="text-gray-300 text-xs animate-pulse">Calculando...</div>;
  
  let colorClass = "text-gray-400";
  if (value > 0.7) colorClass = "text-green-600";
  else if (value > 0.3) colorClass = "text-green-500";
  else if (value < -0.7) colorClass = "text-red-600";
  else if (value < -0.3) colorClass = "text-red-500";
  
  return (
    <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors group border border-transparent hover:border-gray-100"
        onClick={onClick}
        title="Clic para analizar este coeficiente"
    >
      <div className="flex items-center gap-1.5">
          <Calculator size={14} className="text-gray-400 group-hover:text-indigo-500 transition-colors"/>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide group-hover:text-gray-700">Coef. Pearson:</span>
      </div>
      <span className={`text-2xl font-black ${colorClass}`}>{value.toFixed(4)}</span>
      <Info size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface Props {
    apiKey: string;
    onRequireKey: () => void;
    currency: string;
    rate: number;
    availableAssets: Asset[];
}

export default function CryptoCorrelationPro({ apiKey, onRequireKey, currency, rate, availableAssets }: Props) {
  
  const unifiedAssets = useMemo(() => {
      const stables = STABLE_ASSETS.map(s => ({...s, type: 'stable'}));
      const cryptos: any[] = [];
      const stocks: any[] = [];

      TOP_STOCKS.forEach(s => {
          stocks.push({ symbol: s.symbol, name: s.name, type: 'stock', category: 'Top Stock' });
      });

      availableAssets.forEach(asset => {
          if (stables.some(s => s.symbol === asset.symbol)) return;
          const item = { 
              symbol: asset.symbol, 
              name: asset.name, 
              type: (asset.type === 'STOCK' ? 'stock' : 'crypto'), 
              category: (asset.type === 'STOCK' ? 'User Stock' : 'User Crypto') 
          };
          if (asset.type === 'STOCK') {
              if (!stocks.some(s => s.symbol === item.symbol)) stocks.push(item);
          } else {
              cryptos.push(item);
          }
      });

      return {
          stables,
          cryptos: Array.from(new Map(cryptos.map(item => [item.symbol, item])).values()),
          stocks: Array.from(new Map(stocks.map(item => [item.symbol, item])).values()),
          all: [...stables, ...cryptos, ...stocks]
      };
  }, [availableAssets]);

  const [assetA, setAssetA] = useState(unifiedAssets.cryptos.length > 0 ? unifiedAssets.cryptos[0] : unifiedAssets.stables[0]);
  const [assetB, setAssetB] = useState(unifiedAssets.cryptos.length > 1 ? unifiedAssets.cryptos[1] : (unifiedAssets.stocks[0] || unifiedAssets.stables[1]));
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [correlation, setCorrelation] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [scannerResults, setScannerResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lpMetrics, setLpMetrics] = useState<any>(null);
  const [showLpExplanation, setShowLpExplanation] = useState(true);
  const [invertLp, setInvertLp] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(true);
  const [isAiSectionOpen, setIsAiSectionOpen] = useState(true);
  const [showPearsonModal, setShowPearsonModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'conservative' | 'aggressive' | 'accumulation' | null>(null);
  
  const prevAssetA = useRef(assetA);
  const prevAssetB = useRef(assetB);

  useEffect(() => { setScannerResults([]); }, [assetA]);

  useEffect(() => {
    if (!assetA || !assetB) return;
    setShowLpExplanation(false);
    const loadRealData = async () => {
        setIsLoadingData(true);
        setAiAnalysis('');
        setCustomQuery('');
        setCorrelation(null);
        setLpMetrics(null);
        setInvertLp(true);
        try {
            const typeA = (assetA.type === 'stock') ? 'STOCK' : 'CRYPTO';
            const typeB = (assetB.type === 'stock') ? 'STOCK' : 'CRYPTO';
            const [rawA, rawB] = await Promise.all([
                fetchHistoricalSeries(assetA.symbol, typeA, timeframe.days),
                fetchHistoricalSeries(assetB.symbol, typeB, timeframe.days)
            ]);
            if (!rawA.length || !rawB.length) {
                setChartData([]);
                setIsLoadingData(false);
                return;
            }
            const mapB = new Map<string, number>();
            rawB.forEach(p => mapB.set(getDateKey(p.time), p.close));
            const alignedData: any[] = [];
            const alignedPricesA: number[] = [];
            const alignedPricesB: number[] = [];
            const ratios: number[] = [];
            let firstPriceA = 0, firstPriceB = 0;
            for (const pA of rawA) {
                const dateKey = getDateKey(pA.time);
                if (mapB.has(dateKey)) {
                    const priceB = mapB.get(dateKey)!;
                    if (alignedData.length === 0) { firstPriceA = pA.close; firstPriceB = priceB; }
                    alignedPricesA.push(pA.close); alignedPricesB.push(priceB);
                    const r = pA.close / priceB; ratios.push(r);
                    alignedData.push({
                        date: dateKey, priceA: pA.close, priceB: priceB, ratio: r,
                        normA: (pA.close / firstPriceA) * 100,
                        normB: (priceB / firstPriceB) * 100
                    });
                }
            }
            setChartData(alignedData);
            const pearson = calculatePearsonCorrelation(alignedPricesA, alignedPricesB);
            setCorrelation(pearson);
            if (ratios.length > 0) {
                const currentRatio = ratios[ratios.length - 1];
                const minHist = Math.min(...ratios), maxHist = Math.max(...ratios);
                const lastPriceB = alignedPricesB[alignedPricesB.length - 1];
                const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
                const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratios.length;
                const stdDev = Math.sqrt(variance);
                const acqMin = currentRatio * 1.0025;
                let acqMax = currentRatio + (stdDev * 2);
                if (acqMax <= acqMin * 1.005) acqMax = acqMin * 1.05;
                setLpMetrics({
                    current: currentRatio, priceB: lastPriceB,
                    conservative: { min: minHist * 0.95, max: maxHist * 1.05 },
                    aggressive: { min: currentRatio - stdDev, max: currentRatio + stdDev },
                    acquisition: { min: acqMin, max: acqMax },
                    volatility: (stdDev / mean) * 100
                });
            }
        } catch (e) { console.error("Error calculating correlation", e); } finally { setIsLoadingData(false); }
    };
    loadRealData();
    prevAssetA.current = assetA; prevAssetB.current = assetB;
  }, [assetA, assetB, timeframe]);

  const runScanner = async () => {
    setIsScanning(true); setScanProgress(0); setScannerResults([]); setIsScannerOpen(true);
    const targets = unifiedAssets.all.filter(a => a.symbol !== assetA.symbol);
    const results: any[] = [];
    const typeA = (assetA.type === 'stock') ? 'STOCK' : 'CRYPTO';
    const seriesA = await fetchHistoricalSeries(assetA.symbol, typeA, timeframe.days);
    const mapA = new Map<string, number>();
    seriesA.forEach(p => mapA.set(getDateKey(p.time), p.close));
    const BATCH_SIZE = 3; 
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (target) => {
             try {
                const typeTarget = (target.type === 'stock') ? 'STOCK' : 'CRYPTO';
                const seriesTarget = await fetchHistoricalSeries(target.symbol, typeTarget, timeframe.days);
                if (seriesTarget.length < 5) return; 
                const pricesA: number[] = [], pricesTarget: number[] = [];
                for (const pT of seriesTarget) {
                    const dKey = getDateKey(pT.time);
                    if (mapA.has(dKey)) { pricesA.push(mapA.get(dKey)); pricesTarget.push(pT.close); }
                }
                if (pricesA.length > 5) {
                    const corr = calculatePearsonCorrelation(pricesA, pricesTarget);
                    results.push({ asset: target, correlation: corr });
                }
             } catch(e) {}
        }));
        setScanProgress(Math.round(((i + BATCH_SIZE) / targets.length) * 100));
        await new Promise(r => setTimeout(r, 200));
    }
    results.sort((a, b) => b.correlation - a.correlation);
    setScannerResults(results); setIsScanning(false);
  };

  const handleSelectFromScanner = (selectedAsset: any) => { setAssetB(selectedAsset); setIsScannerOpen(false); };
  const handleSwapAssets = () => { const temp = assetA; setAssetA(assetB); setAssetB(temp); };

  const analyzeWithGemini = async () => {
    if (!apiKey) { onRequireKey(); return; }
    if (correlation === null) return;
    setIsAiSectionOpen(true); setIsAnalyzing(true); setAiAnalysis('');
    let prompt = `Actúa como un analista financiero cuantitativo experto. Analiza la correlación MATEMÁTICA de ${correlation.toFixed(4)} entre ${assetA.name} (${assetA.symbol}) y ${assetB.name} (${assetB.symbol}). Periodo analizado: ${timeframe.fullLabel}.`;
    if (customQuery.trim()) prompt += `\nCONSULTA: "${customQuery}"\n`;
    prompt += `Instrucciones: NO Markdown. Usa fuentes UNICODE para títulos. Breve y técnico.`;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAnalysis(response.text || "No se pudo generar el análisis.");
    } catch (error: any) { setAiAnalysis("Error de conexión."); } finally { setIsAnalyzing(false); }
  };

  const algorithmicAnalysis = useMemo(() => {
    if (!lpMetrics) return null;
    const volatility = lpMetrics.volatility;
    const symbolA = invertLp ? assetB.symbol : assetA.symbol;
    const symbolB = invertLp ? assetA.symbol : assetB.symbol;
    const volatilityDesc = volatility < 5 ? "BAJA" : (volatility < 15 ? "MODERADA" : "ALTA");
    let analysisText = `• 𝐃𝐈𝐀𝐆𝐍𝐎́𝐒𝐓𝐈𝐂𝐎: Volatilidad ${volatilityDesc} (${volatility.toFixed(2)}%).\n\n`;
    analysisText += `𝟏. 𝐑𝐀𝐍𝐆𝐎 𝐂𝐎𝐍𝐒𝐄𝐑𝐕𝐀𝐃𝐎𝐑: Posiciones pasivas, minimiza IL.\n𝟐. 𝐑𝐀𝐍𝐆𝐎 𝐀𝐆𝐑𝐄𝐒𝐈𝐕𝐎: Maximiza comisiones, riesgo alto.\n𝟑. 𝐑𝐀𝐍𝐆𝐎 𝐂𝐀𝐏𝐓𝐀𝐂𝐈Ó𝐍: Comprar ${symbolB} con ${symbolA}.`;
    return { title: "ANÁLISIS DE ESTRATEGIA ALGORÍTMICA", text: analysisText, style: "bg-slate-50 border-slate-200 text-slate-800" };
  }, [lpMetrics, invertLp, assetA.symbol, assetB.symbol]);
  
  const lpVals = useMemo(() => {
      if (!lpMetrics) return null;
      if (!invertLp) return { label: `Precio Actual (1 ${assetA.symbol})`, symbol: assetB.symbol, current: lpMetrics.current, cons: lpMetrics.conservative, agg: lpMetrics.aggressive, acq: lpMetrics.acquisition };
      return { label: `Precio Actual (1 ${assetB.symbol})`, symbol: assetA.symbol, current: 1 / lpMetrics.current, cons: { min: 1 / lpMetrics.conservative.max, max: 1 / lpMetrics.conservative.min }, agg: { min: 1 / lpMetrics.aggressive.max, max: 1 / lpMetrics.aggressive.min }, acq: { min: 1 / lpMetrics.acquisition.max, max: 1 / lpMetrics.acquisition.min } };
  }, [lpMetrics, invertLp, assetA.symbol, assetB.symbol]);

  const getRiskBadge = (type: 'conservative' | 'aggressive' | 'accumulation') => {
        if(!lpMetrics) return null;
        const vol = lpMetrics.volatility;
        let score = vol * 2.5; if (correlation && correlation < 0.5) score += 15;
        if (type === 'conservative') score *= 0.5; if (type === 'aggressive') score *= 1.4; if (type === 'accumulation') score *= 0.9;
        if (score < 15) return { label: 'RIESGO BAJO', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: ShieldCheck };
        if (score < 40) return { label: 'RIESGO MEDIO', color: 'text-amber-700 bg-amber-100 border-amber-200', icon: AlertTriangle };
        if (score < 70) return { label: 'RIESGO ALTO', color: 'text-orange-700 bg-orange-100 border-orange-200', icon: Zap };
        return { label: 'RIESGO EXTREMO', color: 'text-red-700 bg-red-100 border-red-200', icon: Flame };
  };

  const formatCrypto = (val: number) => val < 0.0001 ? val.toLocaleString(undefined, { maximumFractionDigits: 9 }) : val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  const formatFiat = (val: number) => lpMetrics?.priceB ? `≈ ${(val * lpMetrics.priceB * rate).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol || "$"}` : "";

  // URL Logic for External Platforms
  const tickerA = assetA.symbol.toUpperCase();
  const tickerB = assetB.symbol.toUpperCase();
  const nameSlugA = assetA.name.toLowerCase().replace(/\s+/g, '-');
  const corrVal = correlation?.toFixed(4) || "0.0000";
  const aiPromptText = encodeURIComponent(`Analiza la correlación entre ${tickerA} y ${tickerB}. Pearson actual: ${corrVal}. Periodo: ${timeframe.fullLabel}. Riesgos y diversificación.`);

  // Custom Comparison URLs
  const investingUrl = `https://es.investing.com/crypto/${nameSlugA}/${tickerA.toLowerCase()}-${tickerB.toLowerCase()}-chart`;
  const yahooUrl = `https://es.finance.yahoo.com/quote/${tickerB}-${tickerA}/`;
  const tradingViewUrl = `https://www.tradingview.com/symbols/${tickerB}${tickerA}/`;
  const koyfinUrl = `https://app.koyfin.com/search?q=${tickerA}%20${tickerB}`;

  return (
    <div className="font-sans text-gray-900 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-shrink-0 flex items-center gap-2">
                <BarChart3 className="text-red-700" size={24} />
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">CRYPTO<span className="text-red-700">CORRELATION</span></h1>
                    <p className="text-xs text-gray-400 font-medium">Real-Data Correlation Engine</p>
                </div>
            </div>
            <div className="flex flex-1 items-end gap-2 max-w-2xl w-full">
                <div className="flex-1"><AssetSelect label="Activo A" selected={assetA} onSelect={setAssetA} cryptoList={unifiedAssets.cryptos} stockList={unifiedAssets.stocks} stableList={unifiedAssets.stables} /></div>
                <div className="pb-2 text-gray-300 cursor-pointer hover:text-indigo-600 hover:scale-110 transition-all" onClick={handleSwapAssets}><ArrowRightLeft size={16} /></div>
                <div className="flex-1"><AssetSelect label="Activo B" selected={assetB} onSelect={setAssetB} cryptoList={unifiedAssets.cryptos} stockList={unifiedAssets.stocks} stableList={unifiedAssets.stables} /></div>
            </div>
        </div>
      </div>

      {/* LP Ranges */}
      {lpVals && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Layers size={14} className="text-indigo-600" />Estrategia de Liquidez (LP / Grid)</h2>
            <button onClick={() => setInvertLp(!invertLp)} className={`text-[10px] flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${invertLp ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}><ArrowUpDown size={10} /> {invertLp ? 'INVERTIDO' : 'NORMAL'}</button>
        </div>
        <div className="px-4 py-2 bg-indigo-50/30 border-b border-indigo-50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500">{lpVals.label}:</span>
            <div className="text-right">
                <span className="font-mono font-bold text-sm text-indigo-900 block leading-none">{formatCrypto(lpVals.current)} {lpVals.symbol}</span>
                {!invertLp && <span className="text-[10px] text-indigo-500 font-bold">{formatFiat(lpVals.current)}</span>}
            </div>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[ {t: 'conservative', v: lpVals.cons, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', accent: 'text-emerald-600' },
               {t: 'aggressive', v: lpVals.agg, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', accent: 'text-amber-600' },
               {t: 'accumulation', v: lpVals.acq, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', accent: 'text-blue-600' }
            ].map((strat, i) => (
                <div key={i} onClick={() => setSelectedStrategy(strat.t as any)} className={`${strat.bg} rounded-lg border ${strat.border} p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] uppercase font-bold ${strat.text} tracking-wide`}>{strat.t.toUpperCase()}</span>
                        {(() => {
                            const risk = getRiskBadge(strat.t as any);
                            if(!risk) return null;
                            return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${risk.color}`}><risk.icon size={8} /> {risk.label}</span>;
                        })()}
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className={`text-[9px] font-bold ${strat.accent} uppercase mb-0.5`}>MIN</div>
                            <div className={`font-mono font-bold ${strat.text} text-lg leading-none`}>{formatCrypto(strat.v.min)}</div>
                        </div>
                        <div className={`h-px ${strat.accent} opacity-20 w-12 mx-2`}></div>
                        <div className="text-right">
                            <div className={`text-[9px] font-bold ${strat.accent} uppercase mb-0.5`}>MAX</div>
                            <div className={`font-mono font-bold ${strat.text} text-lg leading-none`}>{formatCrypto(strat.v.max)}</div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="border-t border-gray-100">
            <button onClick={() => setShowLpExplanation(!showLpExplanation)} className="w-full text-left px-3 py-2 bg-gray-50/50 hover:bg-gray-50 flex justify-between items-center transition-colors group">
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 group-hover:text-indigo-800"><Droplets size={10}/> Interpretación Algorítmica de Rangos</span>
                {showLpExplanation ? <ChevronUp size={12} className="text-gray-400"/> : <ChevronDown size={12} className="text-gray-400"/>}
            </button>
            {showLpExplanation && algorithmicAnalysis && (
                <div className="p-3 bg-gray-50 text-[10px] text-gray-600 space-y-2 border-t border-gray-100 animate-in slide-in-from-top-1">
                    <div className={`p-3 rounded border ${algorithmicAnalysis.style} whitespace-pre-wrap`}>
                        <div className="font-bold flex items-center gap-1 mb-2 uppercase tracking-wide border-b border-black/5 pb-1"><Target size={12} /> {algorithmicAnalysis.title}</div>
                        <p className="leading-relaxed opacity-90">{algorithmicAnalysis.text}</p>
                    </div>
                </div>
            )}
        </div>
      </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Scanner */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col transition-all duration-300 ${isScannerOpen ? 'h-full max-h-[600px] lg:max-h-none' : 'h-auto'}`}>
                <div onClick={() => setIsScannerOpen(!isScannerOpen)} className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 cursor-pointer hover:bg-gray-100">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Search size={14} className="text-red-600" />Mejores Correlaciones</h2>
                        {isScannerOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                    </div>

                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex bg-gray-200/50 rounded-lg p-0.5 border border-gray-200 shadow-inner">
                            {TIMEFRAMES.map((tf) => (
                                <button
                                    key={tf.label}
                                    onClick={() => setTimeframe(tf)}
                                    className={`flex-1 text-[9px] font-black uppercase tracking-tight py-1.5 rounded-md transition-all ${
                                        timeframe.label === tf.label
                                        ? 'bg-white text-red-700 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); runScanner(); }} 
                            disabled={isScanning || isLoadingData} 
                            className="w-full text-[10px] bg-red-700 text-white font-black py-2 rounded-lg hover:bg-red-800 disabled:opacity-50 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                        >
                            {isScanning && <Loader2 size={12} className="animate-spin" />}
                            {isScanning ? 'ESCANEANDO...' : 'BUSCAR CORRELACIONES'}
                        </button>
                    </div>

                    {isScanning && <div className="w-full bg-gray-200 rounded-full h-1 mt-1"><div className="bg-red-600 h-1 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div></div>}
                </div>
                {isScannerOpen && (
                <div className="overflow-y-auto flex-1 p-0 animate-in fade-in">
                    {scannerResults.length === 0 ? <div className="text-center py-8 text-gray-400 text-xs px-4"><span>Ejecuta el escáner para encontrar con qué activo tiene mayor correlación <b>{assetA.symbol}</b> en el periodo seleccionado.</span></div> : (
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0 z-10 text-[10px] uppercase text-gray-500"><tr><th className="text-left py-2 px-3 font-semibold">Activo</th><th className="text-right py-2 px-3 font-semibold">Pearson</th></tr></thead>
                            <tbody className="divide-y divide-gray-50">{scannerResults.map((res, idx) => (<tr key={idx} onClick={() => handleSelectFromScanner(res.asset)} className="hover:bg-red-50 cursor-pointer transition-colors group"><td className="py-2 px-3 font-medium text-gray-700 flex items-center gap-2 group-hover:text-red-700"><span className={`w-1.5 h-1.5 rounded-full ${res.asset.type === 'stock' ? 'bg-blue-400' : (res.asset.type === 'stable' ? 'bg-green-400' : 'bg-orange-400')}`}></span>{res.asset.symbol}</td><td className={`py-2 px-3 text-right font-mono font-bold ${res.correlation > 0.7 ? 'text-green-600' : res.correlation < -0.5 ? 'text-red-600' : 'text-gray-400'}`}>{res.correlation.toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    )}
                </div>
                )}
           </div>
        </div>

        {/* Right Column: Chart & AI */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900"><span className="w-2 h-2 rounded-full bg-gray-900"></span> {assetA.symbol}</div>
                   <span className="text-gray-300 text-xs">vs</span>
                   <div className="flex items-center gap-1.5 text-sm font-bold text-red-600"><span className="w-2 h-2 rounded-full bg-red-600"></span> {assetB.symbol}</div>
                   
                   <div className="ml-4 flex items-center gap-4 py-1 px-3 bg-gray-50/80 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2.5">
                          <a href={tradingViewUrl} target="_blank" rel="noreferrer" title="Comparar en TradingView" className="text-blue-900 hover:text-red-700 transition-all">
                              <i className="fa-solid fa-chart-line text-[11px]"></i>
                          </a>
                          <a href={yahooUrl} target="_blank" rel="noreferrer" title="Yahoo Finanzas" className="text-blue-900 hover:text-red-700 transition-all">
                              <i className="fa-brands fa-yahoo text-[11px]"></i>
                          </a>
                          <a href={investingUrl} target="_blank" rel="noreferrer" title="Investing.com" className="text-blue-900 hover:text-red-700 transition-all">
                              <i className="fa-solid fa-dollar-sign text-[11px]"></i>
                          </a>
                          <a href={koyfinUrl} target="_blank" rel="noreferrer" title="Koyfin" className="text-blue-900 hover:text-red-700 transition-all">
                              <i className="fa-solid fa-magnifying-glass-chart text-[11px]"></i>
                          </a>
                      </div>
                      <div className="w-px h-3 bg-gray-200"></div>
                      <div className="flex items-center gap-2.5">
                          <a href={`https://chat.openai.com/?q=${aiPromptText}`} target="_blank" rel="noreferrer" title="ChatGPT" className="text-blue-900 hover:text-red-700 transition-all"><i className="fa-solid fa-robot text-[11px]"></i></a>
                          <a href={`https://grok.com/?q=${aiPromptText}`} target="_blank" rel="noreferrer" title="Grok" className="text-blue-900 hover:text-red-700 transition-all"><i className="fa-solid fa-bolt text-[11px]"></i></a>
                          <a href={`https://www.perplexity.ai/?q=${aiPromptText}`} target="_blank" rel="noreferrer" title="Perplexity" className="text-blue-900 hover:text-red-700 transition-all"><i className="fa-solid fa-infinity text-[11px]"></i></a>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                    <CorrelationBadge value={correlation} onClick={() => setShowPearsonModal(true)} />
                </div>
             </div>
             <div className="h-[260px] w-full relative">
                {isLoadingData && <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={32} /></div>}
                {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} minTickGap={30}/>
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px' }} formatter={(v: number) => v.toFixed(2)}/>
                    <ReferenceLine y={100} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="normA" name={assetA.symbol} stroke="#111827" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="normB" name={assetB.symbol} stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                ) : !isLoadingData && <div className="h-full flex flex-col items-center justify-center text-gray-400"><AlertCircle size={32} className="mb-2 opacity-20"/><p className="text-xs">No hay datos.</p></div>}
             </div>
          </div>
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex-1 relative overflow-hidden flex flex-col transition-all duration-300 ${isAiSectionOpen ? 'h-auto min-h-[150px]' : 'h-auto'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
            <div onClick={() => setIsAiSectionOpen(!isAiSectionOpen)} className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Brain size={16} className="text-gray-900" />Perspectiva IA</h2>
                {isAiSectionOpen && !isAnalyzing && !aiAnalysis && (<input type="text" value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Añadir consulta específica..." className="flex-1 max-w-xs text-[11px] border border-gray-200 rounded px-2 py-1 outline-none"/>)}
              </div>
              <div className="flex items-center gap-2">
                  { !aiAnalysis && !isAnalyzing && isAiSectionOpen && (<button onClick={(e) => { e.stopPropagation(); analyzeWithGemini(); }} disabled={!correlation} className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold transition-all shadow-sm">Analizar</button>)}
                  {isAiSectionOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
              </div>
            </div>
            {isAiSectionOpen && (
            <div className="bg-gray-50 mx-4 mb-4 px-4 py-3 rounded border border-gray-100 flex-1 overflow-y-auto min-h-[100px] animate-in fade-in">
              {isAnalyzing ? <div className="flex items-center gap-3 h-full"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div><p className="text-gray-500 text-xs animate-pulse">Analizando...</p></div> : aiAnalysis ? (
                <div className="text-gray-700 text-xs leading-relaxed"><div className="whitespace-pre-line">{aiAnalysis}</div><button onClick={analyzeWithGemini} className="mt-2 text-[10px] text-red-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={10} /> Actualizar</button></div>
              ) : <div className="text-gray-400 text-xs flex items-center gap-2 h-full"><Info size={14} className="opacity-50" /><p>Solicita el análisis para entender la correlación entre {assetA.symbol} y {assetB.symbol}.</p></div>}
            </div>
            )}
          </div>
        </div>
      </div>
      {showPearsonModal && correlation !== null && <PearsonModal value={correlation} assetA={assetA.symbol} assetB={assetB.symbol} onClose={() => setShowPearsonModal(false)}/>}
      {selectedStrategy && <StrategyModal type={selectedStrategy} assetA={invertLp ? assetB.symbol : assetA.symbol} assetB={invertLp ? assetA.symbol : assetB.symbol} minPrice={selectedStrategy === 'conservative' ? lpVals?.cons.min : selectedStrategy === 'aggressive' ? lpVals?.agg.min : lpVals?.acq.min} maxPrice={selectedStrategy === 'conservative' ? lpVals?.cons.max : selectedStrategy === 'aggressive' ? lpVals?.agg.max : lpVals?.acq.max} onClose={() => setSelectedStrategy(null)} />}
    </div>
  );
}
