import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Search, RefreshCw, ArrowRightLeft, Info, BarChart3, Loader2, AlertCircle, Layers, ChevronDown, ChevronUp, Droplets, Target, Calculator, MousePointerClick } from 'lucide-react';
import { fetchHistoricalSeries, HistoryPoint } from '../services/market';
import { CURRENCIES } from '../constants';
import PearsonModal from './PearsonModal';
import StrategyModal from './StrategyModal';

// --- CONFIGURACIÓN & UTILIDADES ---

// Lista de activos definidos
const CRYPTO_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', category: 'Store of Value / L1' },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', category: 'Smart Contracts L1' },
  { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', category: 'Exchange / L1' },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', category: 'High Perf L1' },
  { symbol: 'XRP', name: 'XRP', type: 'crypto', category: 'Payments' },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', category: 'Smart Contracts L1' },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', category: 'Meme / Payment' },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', category: 'Smart Contracts L1' },
  { symbol: 'TRX', name: 'Tron', type: 'crypto', category: 'Smart Contracts L1' },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', category: 'Interoperability' },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', category: 'Oracle' },
  { symbol: 'MATIC', name: 'Polygon', type: 'crypto', category: 'L2 Scaling' },
  { symbol: 'SHIB', name: 'Shiba Inu', type: 'crypto', category: 'Meme' },
];

const STABLE_ASSETS = [
  { symbol: 'USDC', name: 'USD Coin', type: 'stable', category: 'Stablecoin' },
  { symbol: 'USDT', name: 'Tether', type: 'stable', category: 'Stablecoin' },
];

const STOCK_ASSETS = [
  { symbol: 'SPY', name: 'S&P 500', type: 'stock', category: 'Index ETF' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stock', category: 'Technology / AI' },
  { symbol: 'AAPL', name: 'Apple', type: 'stock', category: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stock', category: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', category: 'Cons. Discretionary' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock', category: 'Technology' },
  { symbol: 'META', name: 'Meta', type: 'stock', category: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', category: 'Automotive / Tech' },
];

const ALL_ASSETS = [...STABLE_ASSETS, ...CRYPTO_ASSETS, ...STOCK_ASSETS];

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

const AssetSelect = ({ label, selected, onSelect }: { label: string, selected: any, onSelect: (a: any) => void }) => (
  <div className="flex flex-col gap-0.5 w-full">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select 
        className="w-full py-1.5 pl-2 pr-6 border border-gray-300 rounded bg-white text-sm font-semibold text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none shadow-sm appearance-none"
        value={selected.symbol}
        onChange={(e) => {
           const found = ALL_ASSETS.find(a => a.symbol === e.target.value);
           if (found) onSelect(found);
        }}
      >
        <optgroup label="Monedas Base (Stables)">
          {STABLE_ASSETS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
        </optgroup>
        <optgroup label="Cripto Activos">
          {CRYPTO_ASSETS.map(c => <option key={c.symbol} value={c.symbol}>{c.symbol} - {c.name}</option>)}
        </optgroup>
        <optgroup label="Bolsa (Stock Market)">
          {STOCK_ASSETS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>)}
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
}

export default function CryptoCorrelationPro({ apiKey, onRequireKey, currency, rate }: Props) {
  const [assetA, setAssetA] = useState(CRYPTO_ASSETS[0]); // BTC default
  const [assetB, setAssetB] = useState(CRYPTO_ASSETS[1]); // ETH default
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]); // 1 Mes default
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [correlation, setCorrelation] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // AI State
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Scanner State
  const [scannerResults, setScannerResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // LP Metrics State
  const [lpMetrics, setLpMetrics] = useState<any>(null);
  const [showLpExplanation, setShowLpExplanation] = useState(false);

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
    const loadRealData = async () => {
        setIsLoadingData(true);
        setAiAnalysis('');
        setCorrelation(null);
        setLpMetrics(null);

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
                    accumulation: {
                        min: minHist * 0.95, // 5% buffer below historical low
                        max: mean // Up to the average
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
    const targets = ALL_ASSETS.filter(a => a.symbol !== assetA.symbol);
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
                        pricesA.push(mapA.get(dKey)!);
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
    // Don't clear scanner results here so they persist on reopening
    // Auto collapse after selection
    setIsScannerOpen(false);
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

    const prompt = `
      Actúa como un analista financiero cuantitativo experto. 
      Analiza la correlación MATEMÁTICA de ${correlation.toFixed(4)} entre ${assetA.name} (${assetA.symbol}) y ${assetB.name} (${assetB.symbol}).
      Periodo analizado: ${timeframe.fullLabel} (${chartData.length} puntos de coincidencia de mercado).
      
      Contexto:
      - ${assetA.name}: ${assetA.category} (${assetA.type})
      - ${assetB.name}: ${assetB.category} (${assetB.type})
      
      Instrucciones de Formato (IMPORTANTE):
      - NO uses sintaxis Markdown (no uses **bold**, ni # headers).
      - Utiliza FUENTES UNICODE para simular negritas y títulos (ej: 𝐇𝐈𝐒𝐓𝐎𝐑𝐈𝐀, 𝐅𝐮𝐧𝐝𝐚𝐦𝐞𝐧𝐭𝐚𝐥𝐞𝐬).
      - Usa iconos visuales elegantes para los puntos (ej: 🔹, 🔸, 📌, 📉, 📉).
      - Sé breve, técnico y directo al grano.
      
      Contenido:
      1. Interpretación de la fuerza de la correlación (Directa, Inversa, Desacoplada).
      2. ¿Es esta correlación normal para estos activos o una anomalía temporal?
      3. Implicación para un portfolio (Diversificación vs Concentración).
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
    
    const isHighCorr = (correlation || 0) > 0.75;
    const isLowCorr = (correlation || 0) < 0.4;
    const volatility = lpMetrics.volatility; // Coeff variation %
    
    let analysisTitle = "";
    let analysisText = "";
    let style = "";

    if (isLowCorr) {
        analysisTitle = "⚠️ ALERTA: Desacople de Precio";
        analysisText = `La correlación es demasiado baja (${correlation?.toFixed(2)}). Los activos se mueven en direcciones opuestas frecuentemente. PROVEER LIQUIDEZ AQUÍ ES PELIGROSO debido al alto riesgo de Impermanent Loss.`;
        style = "bg-red-50 border-red-200 text-red-800";
    } else if (volatility > 10) { // >10% variation relative to mean
        analysisTitle = "⚡ PRECAUCIÓN: Alta Volatilidad";
        analysisText = `Aunque hay correlación, la volatilidad relativa es alta. El precio oscila con fuerza. El "Rango Agresivo" se romperá con facilidad. Se recomienda encarecidamente usar el Rango Conservador o esperar a que se estabilice.`;
        style = "bg-orange-50 border-orange-200 text-orange-800";
    } else if (isHighCorr) {
        analysisTitle = "✅ ESCENARIO IDEAL: Zona Segura";
        analysisText = `Sincronización perfecta. Ambos activos "respiran" juntos con baja volatilidad relativa. El "Rango Agresivo" tiene altas probabilidades de mantenerse efectivo, maximizando la captura de comisiones (Fees).`;
        style = "bg-emerald-50 border-emerald-200 text-emerald-800";
    } else {
        analysisTitle = "⚖️ ESCENARIO NEUTRO";
        analysisText = `Condiciones de mercado estándar. Si usas el Rango Agresivo, vigila el precio diariamente. El Rango Conservador es una apuesta segura para dejar correr la posición a medio plazo.`;
        style = "bg-blue-50 border-blue-200 text-blue-800";
    }
    
    return { title: analysisTitle, text: analysisText, style };
  }, [lpMetrics, correlation]);
  
  // Helper to format Fiat Price
  const formatFiat = (ratioPrice: number) => {
      if (!lpMetrics || !lpMetrics.priceB) return null;
      // Formula: Ratio (Units of B for 1 A) * Price of B (USD/USDT) * Rate (Selected Currency / USD)
      const val = ratioPrice * lpMetrics.priceB * rate;
      const symbol = CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol || currency;
      
      // Smart digits
      const digits = val < 1 ? 4 : (val < 100 ? 2 : 0);
      
      return `≈ ${val.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${symbol}`;
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
                    <p className="text-[10px] text-gray-400 font-medium">Real-Data Correlation Engine</p>
                </div>
            </div>

            {/* Central Controls */}
            <div className="flex flex-1 items-end gap-2 max-w-2xl w-full">
                <div className="flex-1">
                    <AssetSelect label="Activo A" selected={assetA} onSelect={setAssetA} />
                </div>
                
                <div className="pb-2 text-gray-300">
                    <ArrowRightLeft size={16} />
                </div>

                <div className="flex-1">
                    <AssetSelect label="Activo B" selected={assetB} onSelect={setAssetB} />
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

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Scanner (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
           <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col transition-all duration-300 ${isScannerOpen ? 'h-full max-h-[500px] lg:max-h-none' : 'h-auto'}`}>
                <div 
                    onClick={() => setIsScannerOpen(!isScannerOpen)}
                    className="p-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Search size={14} className="text-red-600" />
                            Escáner Real
                        </h2>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); runScanner(); }}
                                disabled={isScanning || isLoadingData}
                                className="text-[10px] bg-white border border-gray-200 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 transition-colors uppercase tracking-wide flex items-center gap-1 shadow-sm"
                            >
                                {isScanning && <Loader2 size={10} className="animate-spin" />}
                                {isScanning ? 'ESCAN...' : 'EJECUTAR'}
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
          
          {/* LIQUIDITY POOL RANGES SECTION */}
          {lpMetrics && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Layers size={14} className="text-indigo-600" />
                        Estrategia de Liquidez (LP / Grid)
                    </h2>
                    <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">Precio Actual (1 {assetA.symbol}):</span>
                            <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded">
                                {lpMetrics.current.toLocaleString(undefined, { maximumFractionDigits: 6 })} {assetB.symbol}
                            </span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-black tracking-wide">{formatFiat(lpMetrics.current)}</span>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Estrategia Conservadora */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Rango Conservador (Wide)</span>
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">Baja Volatilidad</span>
                        </div>
                        <div 
                            onClick={() => setSelectedStrategy('conservative')}
                            className="bg-emerald-50 rounded-lg border border-emerald-100 p-3 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
                        >
                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MousePointerClick size={12} className="text-emerald-400" />
                             </div>
                             <div className="flex justify-between items-center relative z-10">
                                <div className="text-center">
                                    <p className="text-[9px] text-emerald-600 font-semibold mb-0.5">MIN PRICE</p>
                                    <p className="font-mono font-bold text-emerald-900">{lpMetrics.conservative.min.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-emerald-700 font-bold">{formatFiat(lpMetrics.conservative.min)}</p>
                                </div>
                                <div className="h-px bg-emerald-300 flex-1 mx-4"></div>
                                <div className="text-center">
                                    <p className="text-[9px] text-emerald-600 font-semibold mb-0.5">MAX PRICE</p>
                                    <p className="font-mono font-bold text-emerald-900">{lpMetrics.conservative.max.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-emerald-700 font-bold">{formatFiat(lpMetrics.conservative.max)}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Estrategia Agresiva */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Rango Agresivo (Narrow)</span>
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">Alta Rentabilidad</span>
                        </div>
                        <div 
                            onClick={() => setSelectedStrategy('aggressive')}
                            className="bg-amber-50 rounded-lg border border-amber-100 p-3 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
                        >
                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MousePointerClick size={12} className="text-amber-400" />
                             </div>
                             <div className="flex justify-between items-center relative z-10">
                                <div className="text-center">
                                    <p className="text-[9px] text-amber-600 font-semibold mb-0.5">MIN PRICE</p>
                                    <p className="font-mono font-bold text-amber-900">{lpMetrics.aggressive.min.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-amber-700 font-bold">{formatFiat(lpMetrics.aggressive.min)}</p>
                                </div>
                                <div className="h-px bg-amber-300 flex-1 mx-4"></div>
                                <div className="text-center">
                                    <p className="text-[9px] text-amber-600 font-semibold mb-0.5">MAX PRICE</p>
                                    <p className="font-mono font-bold text-amber-900">{lpMetrics.aggressive.max.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-amber-700 font-bold">{formatFiat(lpMetrics.aggressive.max)}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Estrategia Acumulación (Coste Mínimo) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Rango Compra Coste Mínimo</span>
                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">Acumulación</span>
                        </div>
                        <div 
                            onClick={() => setSelectedStrategy('accumulation')}
                            className="bg-blue-50 rounded-lg border border-blue-100 p-3 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
                        >
                             <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MousePointerClick size={12} className="text-blue-400" />
                             </div>
                             <div className="flex justify-between items-center relative z-10">
                                <div className="text-center">
                                    <p className="text-[9px] text-blue-600 font-semibold mb-0.5">MIN PRICE</p>
                                    <p className="font-mono font-bold text-blue-900">{lpMetrics.accumulation.min.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-blue-700 font-bold">{formatFiat(lpMetrics.accumulation.min)}</p>
                                </div>
                                <div className="h-px bg-blue-300 flex-1 mx-4"></div>
                                <div className="text-center">
                                    <p className="text-[9px] text-blue-600 font-semibold mb-0.5">MAX PRICE</p>
                                    <p className="font-mono font-bold text-blue-900">{lpMetrics.accumulation.max.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    <p className="text-[9px] text-blue-700 font-bold">{formatFiat(lpMetrics.accumulation.max)}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Collapsible Explanation with Dynamic Analysis */}
                <div className="border-t border-gray-100">
                    <button 
                        onClick={() => setShowLpExplanation(!showLpExplanation)}
                        className="w-full text-left px-4 py-2 bg-gray-50/50 hover:bg-gray-50 flex justify-between items-center transition-colors group"
                    >
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:text-indigo-800">
                            <Droplets size={12}/> ¿Cómo interpretar estos rangos?
                        </span>
                        {showLpExplanation ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                    </button>
                    
                    {showLpExplanation && algorithmicAnalysis && (
                        <div className="p-4 bg-gray-50 text-xs text-gray-600 space-y-3 border-t border-gray-100 animate-in slide-in-from-top-1">
                             
                             <div className={`p-3 rounded-lg border ${algorithmicAnalysis.style} mb-3`}>
                                 <div className="font-bold flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wide">
                                     <Target size={12} /> {algorithmicAnalysis.title}
                                 </div>
                                 <p className="leading-relaxed opacity-90">{algorithmicAnalysis.text}</p>
                             </div>

                             <div className="h-px bg-gray-200 w-full my-2"></div>

                             {/* Static Explanation */}
                             <p>
                                <strong>Correlación y Liquidez:</strong> En Pools de Liquidez (como Uniswap V3), el objetivo es mantener el precio dentro de un rango. 
                                Una correlación alta (&gt;0.7) indica que ambos activos se mueven juntos, reduciendo el riesgo de que el precio se salga del rango (Impermanent Loss).
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>
                                    <span className="text-emerald-700 font-bold">Rango Conservador:</span> Basado en los máximos y mínimos históricos del periodo seleccionado (+5% buffer). Ideal para estrategias pasivas donde no quieres rebalancear constantemente.
                                </li>
                                <li>
                                    <span className="text-amber-700 font-bold">Rango Agresivo:</span> Basado en la volatilidad actual (Precio Actual ± 1 Desviación Estándar). Genera muchas más comisiones (Fees) al concentrar la liquidez, pero tiene un riesgo alto de que el precio se salga del rango rápidamente.
                                </li>
                                <li>
                                    <span className="text-blue-700 font-bold">Rango Compra Coste Mínimo:</span> Estrategia de acumulación (DCA Grid). Cubre desde el mínimo histórico hasta la media. Ideal para entrar en el mercado comprando progresivamente más barato sin riesgo de comprar en picos.
                                </li>
                            </ul>
                            <p className="italic opacity-70 mt-1">
                                * Nota: Estos cálculos son teóricos basados en datos pasados. Provee liquidez bajo tu propio riesgo.
                            </p>
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* AI Analysis Section (Compact & Collapsible) */}
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 flex-1 relative overflow-hidden flex flex-col transition-all duration-300 ${isAiSectionOpen ? 'h-auto min-h-[150px]' : 'h-auto'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>
            
            <div 
                onClick={() => setIsAiSectionOpen(!isAiSectionOpen)}
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Brain size={16} className="text-gray-900" />
                Perspectiva IA
              </h2>
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