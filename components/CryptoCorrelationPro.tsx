import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Search, RefreshCw, ArrowRightLeft, Info, BarChart3, Loader2, AlertCircle, Layers, ChevronDown, ChevronUp, Droplets, Target, Calculator, MousePointerClick, ArrowUpDown, ShieldCheck, Zap, AlertTriangle, Flame } from 'lucide-react';
import { fetchHistoricalSeries, HistoryPoint } from '../services/market';
import { CURRENCIES, TOP_STOCKS } from '../constants';
import { Asset } from '../types';
import PearsonModal from './PearsonModal';
import StrategyModal from './StrategyModal';

// --- CONFIGURACIÓN & UTILIDADES ---

const STABLE_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', type: 'stable', category: 'Stablecoin' },
  { symbol: 'USDT', name: 'Tether', type: 'stable', category: 'Stablecoin' },
];

const TIMEFRAMES = [
  { label: '1S', fullLabel: '1 Semana', days: 7 },
  { label: '1M', fullLabel: '1 Mes', days: 30 },
  { label: '3M', fullLabel: '3 Meses', days: 90 },
  { label: '1A', fullLabel: '1 Año', days: 365 },
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
           // We need to find the asset in ANY of the lists
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
  
  // -- CONSTRUCT ASSET LISTS DYNAMICALLY FROM PROPS --
  const unifiedAssets = useMemo(() => {
      // 1. Stables (Internal Hardcoded for usefulness)
      const stables = STABLE_ASSETS.map(s => ({...s, type: 'stable'}));

      // 2. Process User Assets from App State
      const cryptos: any[] = [];
      const stocks: any[] = [];

      // Add Default Top Stocks first to ensure they are available
      TOP_STOCKS.forEach(s => {
          stocks.push({ symbol: s.symbol, name: s.name, type: 'stock', category: 'Top Stock' });
      });

      availableAssets.forEach(asset => {
          // Avoid duplicates if stable is already in list (like USDT)
          if (stables.some(s => s.symbol === asset.symbol)) return;

          const item = { 
              symbol: asset.symbol, 
              name: asset.name, 
              type: (asset.type === 'STOCK' ? 'stock' : 'crypto'), 
              category: (asset.type === 'STOCK' ? 'User Stock' : 'User Crypto') 
          };

          if (asset.type === 'STOCK') {
              // Check if already in stocks (from TOP_STOCKS) to avoid dupes
              if (!stocks.some(s => s.symbol === item.symbol)) {
                  stocks.push(item);
              }
          } else {
              cryptos.push(item);
          }
      });

      // Remove duplicates by symbol just in case (defensive)
      const uniqueCryptos = Array.from(new Map(cryptos.map(item => [item.symbol, item])).values());
      const uniqueStocks = Array.from(new Map(stocks.map(item => [item.symbol, item])).values());

      return {
          stables,
          cryptos: uniqueCryptos,
          stocks: uniqueStocks,
          all: [...stables, ...uniqueCryptos, ...uniqueStocks]
      };
  }, [availableAssets]);

  // Initial State: use the first available items
  const [assetA, setAssetA] = useState(unifiedAssets.cryptos.length > 0 ? unifiedAssets.cryptos[0] : unifiedAssets.stables[0]);
  const [assetB, setAssetB] = useState(unifiedAssets.cryptos.length > 1 ? unifiedAssets.cryptos[1] : (unifiedAssets.stocks[0] || unifiedAssets.stables[1]));

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]); // 1 Mes default
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [correlation, setCorrelation] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customQuery, setCustomQuery] = useState(''); // Nuevo estado para la query opcional
  
  // Scanner State
  const [scannerResults, setScannerResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // LP Metrics State
  const [lpMetrics, setLpMetrics] = useState<any>(null);
  const [showLpExplanation, setShowLpExplanation] = useState(true); // Default open to show details
  const [invertLp, setInvertLp] = useState(true); // Default to INVERTED (True)

  // Modal States
  const [isScannerOpen, setIsScannerOpen] = useState(true);
  const [isAiSectionOpen, setIsAiSectionOpen] = useState(true);
  const [showPearsonModal, setShowPearsonModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'conservative' | 'aggressive' | 'accumulation' | null>(null);
  
  const prevAssetA = useRef(assetA);
  const prevAssetB = useRef(assetB);

  // --- LOGICA DE DATOS REALES ---
  
  // Reset scanner results ONLY when Asset A changes (since results are relative to A)
  useEffect(() => {
    setScannerResults([]);
  }, [assetA]);

  useEffect(() => {
    if (!assetA || !assetB) return;

    // Reset interpretation on new pair/timeframe
    setShowLpExplanation(false);

    const loadRealData = async () => {
        setIsLoadingData(true);
        setAiAnalysis('');
        setCustomQuery(''); // Limpiar la query al cambiar activos
        setCorrelation(null);
        setLpMetrics(null);
        // Reset inversion on new pair load to Default (Inverted)
        setInvertLp(true);

        try {
            // 1. Fetch raw series for both
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

            // 2. Align Data (Intersection)
            const mapB = new Map<string, number>();
            rawB.forEach(p => mapB.set(getDateKey(p.time), p.close));

            const alignedData: any[] = [];
            const alignedPricesA: number[] = [];
            const alignedPricesB: number[] = [];
            const ratios: number[] = [];

            let firstPriceA = 0;
            let firstPriceB = 0;

            for (const pA of rawA) {
                const dateKey = getDateKey(pA.time);
                if (mapB.has(dateKey)) {
                    const priceB = mapB.get(dateKey)!;
                    
                    if (alignedData.length === 0) {
                        firstPriceA = pA.close;
                        firstPriceB = priceB;
                    }

                    alignedPricesA.push(pA.close);
                    alignedPricesB.push(priceB);
                    
                    // Ratio for LP: How many units of B do I get for 1 unit of A?
                    const r = pA.close / priceB;
                    ratios.push(r);

                    alignedData.push({
                        date: dateKey,
                        priceA: pA.close,
                        priceB: priceB,
                        ratio: r,
                        normA: (pA.close / firstPriceA) * 100,
                        normB: (priceB / firstPriceB) * 100
                    });
                }
            }

            setChartData(alignedData);

            // 3. Calculate Pearson
            const pearson = calculatePearsonCorrelation(alignedPricesA, alignedPricesB);
            setCorrelation(pearson);

            // 4. Calculate LP Ranges
            if (ratios.length > 0) {
                const currentRatio = ratios[ratios.length - 1];
                const minHist = Math.min(...ratios);
                const maxHist = Math.max(...ratios);
                const lastPriceB = alignedPricesB[alignedPricesB.length - 1];
                
                // Calculate Volatility (StdDev of ratios)
                const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
                const variance = ratios.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / ratios.length;
                const stdDev = Math.sqrt(variance);
                
                // ACQUISITION / CONVERSION STRATEGY CALCULATION
                // Goal: Convert Asset A to Asset B.
                // Mechanism: Sell Asset A as price rises.
                // LP Position: Range strictly ABOVE current price.
                // Deposit: 100% Asset A.
                // Buffer: 0.25% (previously 1%) above current price to ensure Out-of-Range status and avoid slipping.
                
                const acqMin = currentRatio * 1.0025;
                let acqMax = currentRatio + (stdDev * 2);
                
                // Safeguard: Ensure max is always greater than min significantly (at least 0.5% spread)
                if (acqMax <= acqMin * 1.005) {
                    acqMax = acqMin * 1.05; // Force at least 5% range if volatility is too low
                }

                setLpMetrics({
                    current: currentRatio,
                    priceB: lastPriceB,
                    conservative: {
                        min: minHist * 0.95, // 5% buffer below historical low
                        max: maxHist * 1.05  // 5% buffer above historical high
                    },
                    aggressive: {
                        min: currentRatio - stdDev, // 1 StdDev Down
                        max: currentRatio + stdDev  // 1 StdDev Up
                    },
                    acquisition: {
                        min: acqMin, 
                        max: acqMax 
                    },
                    volatility: (stdDev / mean) * 100 // Coeff of variation %
                });
            }

        } catch (e) {
            console.error("Error calculating correlation", e);
        } finally {
            setIsLoadingData(false);
        }
    };

    loadRealData();
    prevAssetA.current = assetA;
    prevAssetB.current = assetB;
  }, [assetA, assetB, timeframe]);

  // --- LOGICA DEL ESCANER REAL ---

  const runScanner = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScannerResults([]);
    // Ensure scanner is open when running
    setIsScannerOpen(true);
    
    // Filtramos para no compararse a si mismo
    const targets = unifiedAssets.all.filter(a => a.symbol !== assetA.symbol);
    const results: any[] = [];
    
    // Obtenemos Data A una vez
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

                const pricesA: number[] = [];
                const pricesTarget: number[] = [];

                for (const pT of seriesTarget) {
                    const dKey = getDateKey(pT.time);
                    if (mapA.has(dKey)) {
                        pricesA.push(mapA.get(dKey));
                        pricesTarget.push(pT.close);
                    }
                }

                if (pricesA.length > 5) {
                    const corr = calculatePearsonCorrelation(pricesA, pricesTarget);
                    results.push({ asset: target, correlation: corr });
                }

             } catch(e) { /* ignore error in scanner */ }
        }));
        
        setScanProgress(Math.round(((i + BATCH_SIZE) / targets.length) * 100));
        await new Promise(r => setTimeout(r, 200));
    }

    results.sort((a, b) => b.correlation - a.correlation);
    setScannerResults(results);
    setIsScanning(false);
  };

  const handleSelectFromScanner = (selectedAsset: any) => {
    setAssetB(selectedAsset);
    // Auto collapse after selection
    setIsScannerOpen(false);
  };

  const handleSwapAssets = () => {
      const temp = assetA;
      setAssetA(assetB);
      setAssetB(temp);
  };

  const analyzeWithGemini = async () => {
    if (!apiKey) {
        onRequireKey();
        return;
    }
    if (correlation === null) return;
    
    // Ensure AI section is open
    setIsAiSectionOpen(true);
    setIsAnalyzing(true);
    setAiAnalysis('');

    let prompt = `
      Actúa como un analista financiero cuantitativo experto. 
      Analiza la correlación MATEMÁTICA de ${correlation.toFixed(4)} entre ${assetA.name} (${assetA.symbol}) y ${assetB.name} (${assetB.symbol}).
      Periodo analizado: ${timeframe.fullLabel} (${chartData.length} puntos de coincidencia de mercado).
      
      Contexto:
      - ${assetA.name}: ${assetA.category} (${assetA.type})
      - ${assetB.name}: ${assetB.category} (${assetB.type})
    `;

    // Si hay una query personalizada, la inyectamos
    if (customQuery.trim()) {
        prompt += `
        \n--------------------------------
        CONSULTA ESPECÍFICA DEL USUARIO:
        "${customQuery}"
        
        IMPORTANTE: Debes responder a esta pregunta de forma prioritaria en tu análisis.
        --------------------------------\n
        `;
    }

    prompt += `
      Instrucciones de Formato (IMPORTANTE):
      - NO uses sintaxis Markdown (no uses **bold**, ni # headers).
      - Utiliza FUENTES UNICODE para simular negritas y títulos (ej: 𝐇𝐈𝐒𝐓𝐎𝐑𝐈𝐀, 𝐅𝐮𝐧𝐝𝐚𝐦𝐞𝐧𝐭𝐚𝐥𝐞𝐬).
      - Usa iconos visuales elegantes para los puntos (ej: 🔹, 🔸, 📌, 📉, 📉).
      - Sé breve, técnico y directo al grano.
      
      Contenido Requerido:
      1. Interpretación de la fuerza de la correlación (Directa, Inversa, Desacoplada).
      2. ¿Es esta correlación normal para estos activos o una anomalía temporal?
      3. Implicación para un portfolio (Diversificación vs Concentración).
      ${customQuery.trim() ? '4. RESPUESTA A LA CONSULTA DEL USUARIO.' : ''}
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      
      if (!response.ok) {
           const errText = await response.text();
           // Check for key errors or permission errors
           if (response.status === 400 || response.status === 403) {
               onRequireKey();
               throw new Error("API_KEY_INVALID");
           }
           throw new Error(errText);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el análisis.";
      setAiAnalysis(text);
    } catch (error) {
      if (String(error).includes('API_KEY_INVALID')) {
          setAiAnalysis("⚠️ API Key inválida.");
      } else {
          setAiAnalysis("Error de conexión con Gemini.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- ALGORITHMIC ANALYSIS LOGIC (Memoized) ---
  const algorithmicAnalysis = useMemo(() => {
    if (!lpMetrics) return null;
    
    const volatility = lpMetrics.volatility; // Coeff variation %
    const symbolA = invertLp ? assetB.symbol : assetA.symbol;
    const symbolB = invertLp ? assetA.symbol : assetB.symbol;
    
    let analysisTitle = "ANÁLISIS DE ESTRATEGIA ALGORÍTMICA";
    let style = "bg-slate-50 border-slate-200 text-slate-800";
    
    const volatilityDesc = volatility < 5 ? "BAJA (Muy Estable)" : (volatility < 15 ? "MODERADA (Estándar)" : "ALTA (Peligrosa)");
    
    // Detailed Structured Text
    let analysisText = `• 𝐃𝐈𝐀𝐆𝐍𝐎́𝐒𝐓𝐈𝐂𝐎: La volatilidad relativa en este periodo ha sido ${volatilityDesc} (${volatility.toFixed(2)}%).\n\n`;
    
    // Conservative
    analysisText += `𝟏. 𝐑𝐀𝐍𝐆𝐎 𝐂𝐎𝐍𝐒𝐄𝐑𝐕𝐀𝐃𝐎𝐑 (Wide)\n`;
    analysisText += `• 𝐎𝐛𝐣𝐞𝐭𝐢𝐯𝐨: Cobertura total del movimiento histórico.\n`;
    analysisText += `• 𝐓𝐚́𝐜𝐭𝐢𝐜𝐚: Provee liquidez en todo el espectro detectado +5% de margen. Ideal para posiciones pasivas "set & forget". Minimiza el riesgo de salida del rango (Impermanent Loss bajo), pero diluye el capital reduciendo el APR.\n\n`;
    
    // Aggressive
    analysisText += `𝟐. 𝐑𝐀𝐍𝐆𝐎 𝐀𝐆𝐑𝐄𝐒𝐈𝐕𝐎 (Narrow)\n`;
    analysisText += `• 𝐎𝐛𝐣𝐞𝐭𝐢𝐯𝐨: Maximización de rendimiento inmediato.\n`;
    analysisText += `• 𝐓𝐚́𝐜𝐭𝐢𝐜𝐚: Concentra el capital solo donde está el precio ahora (±1 Desviación Estándar). ${volatility < 5 ? 'Al ser baja la volatilidad, es la opción recomendada.' : 'Con alta volatilidad, es arriesgado: el precio se saldrá rápido.'}\n\n`;
    
    // Acquisition (Conversion A -> B)
    analysisText += `𝟑. 𝐑𝐀𝐍𝐆𝐎 𝐂𝐀𝐏𝐓𝐀𝐂𝐈Ó𝐍 (Operación: Comprar ${symbolB} con ${symbolA})\n`;
    analysisText += `• 𝐎𝐛𝐣𝐞𝐭𝐢𝐯𝐨: Transformar tu liquidez del Activo A (Base) en Activo B (Objetivo).\n`;
    analysisText += `• 𝐓𝐚́𝐜𝐭𝐢𝐜𝐚: Aportas el 100% de la liquidez en Activo A. El rango se sitúa SUPERIOR al precio actual. Mecánica: A medida que el precio sube y cruza el rango, el protocolo vende inteligentemente tu A para adquirir B. Si el precio completa el rango, tu cartera habrá rotado completamente a ${symbolB}.`;

    return { title: analysisTitle, text: analysisText, style };
  }, [lpMetrics, invertLp, assetA.symbol, assetB.symbol]);
  
  // Helper to get displayed numbers based on inversion
  const getLpValues = () => {
      if (!lpMetrics) return null;
      if (!invertLp) {
          // Normal: 1 Unit A = X Unit B
          return {
              label: `Precio Actual (1 ${assetA.symbol})`,
              symbol: assetB.symbol,
              current: lpMetrics.current,
              cons: lpMetrics.conservative,
              agg: lpMetrics.aggressive,
              acq: lpMetrics.acquisition
          };
      } else {
          // Inverted: 1 Unit B = X Unit A
          // When inverting, Min becomes 1/Max and Max becomes 1/Min
          return {
              label: `Precio Actual (1 ${assetB.symbol})`,
              symbol: assetA.symbol,
              current: 1 / lpMetrics.current,
              cons: { min: 1 / lpMetrics.conservative.max, max: 1 / lpMetrics.conservative.min },
              agg: { min: 1 / lpMetrics.aggressive.max, max: 1 / lpMetrics.aggressive.min },
              acq: { min: 1 / lpMetrics.acquisition.max, max: 1 / lpMetrics.acquisition.min }
          };
      }
  };

  const lpVals = getLpValues();

  // Helper Risk Calculation
  const getRiskBadge = (type: 'conservative' | 'aggressive' | 'accumulation') => {
        if(!lpMetrics) return null;
        
        const vol = lpMetrics.volatility; // Coeff variation
        // Logic: Volatility is the main risk factor for IL
        // Correlation also matters but simplified: High Vol = High IL Risk
        
        let baseScore = vol * 2.5; 
        if (correlation && correlation < 0.5) baseScore += 15; // Divergence Risk
        
        let finalScore = baseScore;
        // Strategy Modifiers
        if (type === 'conservative') finalScore *= 0.5; // Wider range = Less risk of being out of range
        if (type === 'aggressive') finalScore *= 1.4; // Narrow range = High risk
        if (type === 'accumulation') finalScore *= 0.9; // Directional risk
        
        if (finalScore < 15) return { label: 'RIESGO BAJO', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: ShieldCheck };
        if (finalScore < 40) return { label: 'RIESGO MEDIO', color: 'text-amber-700 bg-amber-100 border-amber-200', icon: AlertTriangle };
        if (finalScore < 70) return { label: 'RIESGO ALTO', color: 'text-orange-700 bg-orange-100 border-orange-200', icon: Zap };
        return { label: 'RIESGO EXTREMO', color: 'text-red-700 bg-red-100 border-red-200', icon: Flame };
  };

  // Helper to format prices
  const formatCrypto = (val: number) => {
      // Use more decimals for very small numbers (like BTC pairs or memecoins)
      if (val < 0.0001) {
          return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 9 });
      }
      return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
  };

  const formatFiat = (val: number) => {
      if(!lpMetrics || !lpMetrics.priceB) return "";
      const estimatedValue = val * lpMetrics.priceB * rate;
      const curSymbol = CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol || "$";
      return `≈ ${estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curSymbol}`;
  };


  // --- RENDERERS DE UI ---

  return (
    <div className="font-sans text-gray-900 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1. Header & Controls Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
                <BarChart3 className="text-red-600" size={24} />
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                        CRYPTO<span className="text-red-600">CORRELATION</span>
                    </h1>
                    <p className="text-xs text-gray-400 font-medium">Real-Data Correlation Engine</p>
                </div>
            </div>

            {/* Central Controls */}
            <div className="flex flex-1 items-end gap-2 max-w-2xl w-full">
                <div className="flex-1">
                    <AssetSelect 
                        label="Activo A" 
                        selected={assetA} 
                        onSelect={setAssetA} 
                        cryptoList={unifiedAssets.cryptos}
                        stockList={unifiedAssets.stocks}
                        stableList={unifiedAssets.stables}
                    />
                </div>
                
                <div 
                    className="pb-2 text-gray-300 cursor-pointer hover:text-indigo-600 hover:scale-110 transition-all"
                    onClick={handleSwapAssets}
                    title="Intercambiar Activos"
                >
                    <ArrowRightLeft size={16} />
                </div>

                <div className="flex-1">
                    <AssetSelect 
                        label="Activo B" 
                        selected={assetB} 
                        onSelect={setAssetB} 
                        cryptoList={unifiedAssets.cryptos}
                        stockList={unifiedAssets.stocks}
                        stableList={unifiedAssets.stables}
                    />
                </div>

                <div className="flex flex-col gap-0.5 ml-2">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Periodo</label>
                     <div className="flex bg-gray-100 rounded p-0.5">
                        {TIMEFRAMES.map((tf) => (
                            <button
                            key={tf.label}
                            onClick={() => setTimeframe(tf)}
                            className={`text-[10px] font-bold py-1.5 px-2.5 rounded-sm transition-all ${
                                timeframe.label === tf.label
                                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            >
                            {tf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* NEW: LIQUIDITY POOL RANGES SECTION (Full Width for Horizontal Layout) */}
      {lpVals && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers size={14} className="text-indigo-600" />
                Estrategia de Liquidez (LP / Grid)
            </h2>
            <button 
                onClick={() => setInvertLp(!invertLp)}
                className={`text-[10px] flex items-center gap-1 font-bold px-2 py-1 rounded transition-colors ${invertLp ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title="Invertir par (1/x)"
            >
                <ArrowUpDown size={10} /> {invertLp ? 'INVERTIDO' : 'NORMAL'}
            </button>
        </div>
        
        {/* Current Price Highlight */}
        <div className="px-4 py-2 bg-indigo-50/30 border-b border-indigo-50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500">{lpVals.label}:</span>
            <div className="text-right">
                <span className="font-mono font-bold text-sm text-indigo-900 block leading-none">
                        {formatCrypto(lpVals.current)} {lpVals.symbol}
                </span>
                {!invertLp && <span className="text-[10px] text-indigo-500 font-bold">{formatFiat(lpVals.current)}</span>}
            </div>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Estrategia Conservadora */}
            <div 
                onClick={() => setSelectedStrategy('conservative')}
                className="bg-emerald-50 rounded-lg border border-emerald-200 p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wide">RANGO CONSERVADOR (WIDE)</span>
                        {(() => {
                            const risk = getRiskBadge('conservative');
                            if(!risk) return null;
                            const RiskIcon = risk.icon;
                            return (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${risk.color}`}>
                                    <RiskIcon size={8} /> {risk.label}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase mb-0.5">MIN PRICE</div>
                        <div className="font-mono font-bold text-emerald-900 text-lg leading-none">{formatCrypto(lpVals.cons.min)}</div>
                        {!invertLp && <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{formatFiat(lpVals.cons.min)}</div>}
                        </div>
                        
                        {/* Visual Line */}
                        <div className="h-px bg-emerald-300 w-12 mx-2"></div>

                        <div className="text-right">
                        <div className="text-[9px] font-bold text-emerald-600 uppercase mb-0.5">MAX PRICE</div>
                        <div className="font-mono font-bold text-emerald-900 text-lg leading-none">{formatCrypto(lpVals.cons.max)}</div>
                        {!invertLp && <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{formatFiat(lpVals.cons.max)}</div>}
                        </div>
                    </div>
            </div>

            {/* Estrategia Agresiva */}
            <div 
                onClick={() => setSelectedStrategy('aggressive')}
                className="bg-amber-50 rounded-lg border border-amber-200 p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wide">RANGO AGRESIVO (NARROW)</span>
                        {(() => {
                            const risk = getRiskBadge('aggressive');
                            if(!risk) return null;
                            const RiskIcon = risk.icon;
                            return (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${risk.color}`}>
                                    <RiskIcon size={8} /> {risk.label}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                        <div className="text-[9px] font-bold text-amber-600 uppercase mb-0.5">MIN PRICE</div>
                        <div className="font-mono font-bold text-amber-900 text-lg leading-none">{formatCrypto(lpVals.agg.min)}</div>
                        {!invertLp && <div className="text-[10px] text-amber-700 font-medium mt-0.5">{formatFiat(lpVals.agg.min)}</div>}
                        </div>
                        
                        {/* Visual Line */}
                        <div className="h-px bg-amber-300 w-12 mx-2"></div>

                        <div className="text-right">
                        <div className="text-[9px] font-bold text-amber-600 uppercase mb-0.5">MAX PRICE</div>
                        <div className="font-mono font-bold text-amber-900 text-lg leading-none">{formatCrypto(lpVals.agg.max)}</div>
                        {!invertLp && <div className="text-[10px] text-amber-700 font-medium mt-0.5">{formatFiat(lpVals.agg.max)}</div>}
                        </div>
                    </div>
                    <MousePointerClick size={12} className="absolute top-2 right-2 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Estrategia Captación */}
            <div 
                onClick={() => setSelectedStrategy('accumulation')}
                className="bg-blue-50 rounded-lg border border-blue-200 p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
            >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wide">RANGO CAPTACIÓN</span>
                        {(() => {
                            const risk = getRiskBadge('accumulation');
                            if(!risk) return null;
                            const RiskIcon = risk.icon;
                            return (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${risk.color}`}>
                                    <RiskIcon size={8} /> {risk.label}
                                </span>
                            );
                        })()}
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                        <div className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">MIN PRICE</div>
                        <div className="font-mono font-bold text-blue-900 text-lg leading-none">{formatCrypto(lpVals.acq.min)}</div>
                        {!invertLp && <div className="text-[10px] text-blue-700 font-medium mt-0.5">{formatFiat(lpVals.acq.min)}</div>}
                        </div>
                        
                        {/* Visual Line */}
                        <div className="h-px bg-blue-300 w-12 mx-2"></div>

                        <div className="text-right">
                        <div className="text-[9px] font-bold text-blue-600 uppercase mb-0.5">MAX PRICE</div>
                        <div className="font-mono font-bold text-blue-900 text-lg leading-none">{formatCrypto(lpVals.acq.max)}</div>
                        {!invertLp && <div className="text-[10px] text-blue-700 font-medium mt-0.5">{formatFiat(lpVals.acq.max)}</div>}
                        </div>
                    </div>
            </div>
        </div>

        {/* Collapsible Explanation */}
        <div className="border-t border-gray-100">
            <button 
                onClick={() => setShowLpExplanation(!showLpExplanation)}
                className="w-full text-left px-3 py-2 bg-gray-50/50 hover:bg-gray-50 flex justify-between items-center transition-colors group"
            >
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 group-hover:text-indigo-800">
                    <Droplets size={10}/> Interpretación Algorítmica de Rangos
                </span>
                {showLpExplanation ? <ChevronUp size={12} className="text-gray-400"/> : <ChevronDown size={12} className="text-gray-400"/>}
            </button>
            
            {showLpExplanation && algorithmicAnalysis && (
                <div className="p-3 bg-gray-50 text-[10px] text-gray-600 space-y-2 border-t border-gray-100 animate-in slide-in-from-top-1">
                        <div className={`p-3 rounded border ${algorithmicAnalysis.style} whitespace-pre-wrap`}>
                            <div className="font-bold flex items-center gap-1 mb-2 uppercase tracking-wide border-b border-black/5 pb-1">
                                <Target size={12} /> {algorithmicAnalysis.title}
                            </div>
                            <p className="leading-relaxed opacity-90">{algorithmicAnalysis.text}</p>
                        </div>
                </div>
            )}
        </div>
      </div>
      )}

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Scanner (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* REAL SCANNER */}
            <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col transition-all duration-300 ${isScannerOpen ? 'h-full max-h-[500px] lg:max-h-none' : 'h-auto'}`}>
                <div 
                    onClick={() => setIsScannerOpen(!isScannerOpen)}
                    className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Search size={14} className="text-red-600" />
                            Escáner en tiempo real
                        </h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); runScanner(); }}
                                disabled={isScanning || isLoadingData}
                                className="text-[10px] bg-white border border-gray-200 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors uppercase tracking-wide flex items-center gap-1 shadow-sm"
                            >
                                {isScanning && <Loader2 size={10} className="animate-spin" />}
                                {isScanning ? 'ESCAN...' : 'ESCANEAR'}
                            </button>
                            {isScannerOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                        </div>
                    </div>
                    {isScanning && (
                         <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                            <div className="bg-red-600 h-1 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                         </div>
                    )}
                </div>
                
                {isScannerOpen && (
                <div className="overflow-y-auto flex-1 p-0 animate-in fade-in slide-in-from-top-1">
                    {scannerResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs px-4">
                            {isScanning ? (
                                <span className="animate-pulse">Analizando mercados en tiempo real...<br/>Esto puede tardar unos segundos.</span>
                            ) : (
                                <span>Ejecuta el escáner para encontrar con qué activo tiene mayor correlación <b>{assetA.symbol}</b> en los últimos {timeframe.fullLabel}.</span>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0 z-10 text-[10px] uppercase text-gray-500">
                            <tr>
                            <th className="text-left py-2 px-3 font-semibold">Activo</th>
                            <th className="text-right py-2 px-3 font-semibold">Pearson</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {scannerResults.map((res, idx) => (
                            <tr 
                                key={idx} 
                                onClick={() => handleSelectFromScanner(res.asset)}
                                className="hover:bg-red-50 cursor-pointer transition-colors group"
                                title="Click para comparar"
                            >
                                <td className="py-2 px-3 font-medium text-gray-700 flex items-center gap-2 group-hover:text-red-700">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${res.asset.type === 'stock' ? 'bg-blue-400' : (res.asset.type === 'stable' ? 'bg-green-400' : 'bg-orange-400')}`}></span>
                                {res.asset.symbol}
                                </td>
                                <td className={`py-2 px-3 text-right font-mono font-bold ${
                                res.correlation > 0.7 ? 'text-green-600' : 
                                res.correlation < -0.5 ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                {res.correlation.toFixed(2)}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </div>
                )}
           </div>
        </div>

        {/* Right Column: Chart & AI (9 cols) */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Chart Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                        <span className="w-2 h-2 rounded-full bg-gray-900"></span> {assetA.symbol}
                   </div>
                   <span className="text-gray-300 text-xs">vs</span>
                   <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span> {assetB.symbol}
                   </div>
                </div>
                <CorrelationBadge value={correlation} onClick={() => setShowPearsonModal(true)} />
             </div>

             <div className="h-[260px] w-full relative">
                {isLoadingData && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-red-600" size={32} />
                    </div>
                )}
                
                {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fill: '#9ca3af'}} 
                        axisLine={false} 
                        tickLine={false} 
                        minTickGap={30}
                    />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: 0 }}
                      labelStyle={{ display: 'none' }}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <ReferenceLine y={100} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="normA" 
                      name={assetA.symbol}
                      stroke="#111827" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{r: 4}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="normB"
                      name={assetB.symbol}
                      stroke="#dc2626" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{r: 4}}
                    />
                  </LineChart>
                </ResponsiveContainer>
                ) : !isLoadingData && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <AlertCircle size={32} className="mb-2 opacity-20"/>
                        <p className="text-xs">No hay coincidencia de datos para el periodo seleccionado.</p>
                    </div>
                )}
             </div>
          </div>
          
          {/* AI Analysis Section (Compact & Collapsible) */}
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex-1 relative overflow-hidden flex flex-col transition-all duration-300 ${isAiSectionOpen ? 'h-auto min-h-[150px]' : 'h-auto'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
            
            <div 
                onClick={() => setIsAiSectionOpen(!isAiSectionOpen)}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {/* HEADER WITH TITLE AND INPUT */}
              <div className="flex items-center gap-4 flex-1">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                    <Brain size={16} className="text-gray-900" />
                    Perspectiva IA
                </h2>
                
                {/* Optional Custom Query Input */}
                {isAiSectionOpen && !isAnalyzing && !aiAnalysis && (
                    <input 
                        type="text" 
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent collapse on click
                        onKeyDown={(e) => { 
                            if(e.key === 'Enter') {
                                e.stopPropagation();
                                analyzeWithGemini();
                            }
                        }}
                        placeholder="Añadir consulta específica..."
                        className="flex-1 max-w-xs text-[11px] border border-gray-200 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400"
                    />
                )}
              </div>

              <div className="flex items-center gap-2">
                  { !aiAnalysis && !isAnalyzing && isAiSectionOpen && (
                     <button 
                      onClick={(e) => { e.stopPropagation(); analyzeWithGemini(); }}
                      disabled={!correlation}
                      className="bg-black hover:bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                     >
                       Analizar
                     </button>
                  )}
                  {isAiSectionOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
              </div>
            </div>

            {isAiSectionOpen && (
            <div className="bg-gray-50 mx-4 mb-4 px-4 py-3 rounded border border-gray-100 flex-1 overflow-y-auto min-h-[100px] animate-in fade-in slide-in-from-top-1">
              {isAnalyzing ? (
                <div className="flex items-center gap-3 h-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <p className="text-gray-500 text-xs animate-pulse">Procesando fundamentales...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed">
                  <div className="whitespace-pre-line">
                    {aiAnalysis}
                  </div>
                  <button 
                    onClick={analyzeWithGemini}
                    className="mt-2 text-[10px] text-red-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Actualizar
                  </button>
                </div>
              ) : (
                <div className="text-gray-400 text-xs flex items-center gap-2 h-full">
                  <Info size={14} className="opacity-50" />
                  <p>Solicita el análisis para entender la correlación entre {assetA.symbol} y {assetB.symbol}.</p>
                </div>
              )}
            </div>
            )}
          </div>

        </div>
      </div>
      
      {showPearsonModal && correlation !== null && (
          <PearsonModal 
             value={correlation} 
             assetA={assetA.symbol} 
             assetB={assetB.symbol} 
             onClose={() => setShowPearsonModal(false)}
          />
      )}

      {selectedStrategy && (
          <StrategyModal 
            type={selectedStrategy} 
            onClose={() => setSelectedStrategy(null)} 
          />
      )}
    </div>
  );
}