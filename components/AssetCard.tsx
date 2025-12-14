import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, Info, Calendar, CalendarDays, CalendarRange, Sparkles, Users, LineChart, Loader2, Zap, ArrowUpToLine, ArrowDownToLine, ChevronLeft, ChevronRight, X, Building2, Lock, Star, Activity } from 'lucide-react';
import { Asset, MarketData, TimeframeAnalysis, CurrencyCode } from '../types';
import { COLORS, CURRENCIES, STAGES } from '../constants';
import { fetchAssetData } from '../services/market';
import { generateGeminiContent } from '../services/gemini';
import OracleModal from './OracleModal';
import FundamentalModal from './FundamentalModal';
import ProfilesModal from './ProfilesModal';
import ChartModal from './ChartModal';
import MA20Modal from './MA20Modal';
import RSIModal from './RSIModal';

interface Props {
  asset: Asset;
  index: number;
  total: number;
  refreshTrigger: number;
  currency: CurrencyCode;
  rate: number;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
  isFixed?: boolean;
  apiKey: string;
  onRequireKey: () => void;
}

const PhaseBadge: React.FC<{ 
    label: string; 
    analysis: TimeframeAnalysis | null; 
    icon: React.ElementType; // Use React.ElementType for components
    currency: CurrencyCode; 
    rate: number;
    onRsiClick: (val: number, label: string) => void;
}> = ({ label, analysis, icon: Icon, currency, rate, onRsiClick }) => {
    if (!analysis) return <div className="text-xs text-gray-400">N/A</div>;
    
    // Ensure stage exists and has an icon (rehydrated)
    const S = analysis.stage;
    if (!S || !S.icon) return <div className="text-xs text-gray-400">Err</div>;

    const StatusIcon = S.icon;
    const { pivots, rsi } = analysis;
    const curConf = CURRENCIES[currency];

    const formatPrice = (val: number) => {
       const converted = val * rate;
       const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
       return converted.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    // RSI Logic colors
    let rsiColor = "text-blue-500";
    let rsiBg = "bg-blue-50 border-blue-100 hover:bg-blue-100";
    if (rsi >= 70) {
        rsiColor = "text-red-600";
        rsiBg = "bg-red-50 border-red-100 hover:bg-red-100";
    } else if (rsi <= 30) {
        rsiColor = "text-emerald-600";
        rsiBg = "bg-emerald-50 border-emerald-100 hover:bg-emerald-100";
    }

    return (
      <div className={`flex flex-col p-2 rounded border border-gray-100 ${S.bg} flex-1 print:bg-white print:border-gray-300`}>
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1"><Icon size={12} className="text-gray-500" /><span className="text-[10px] font-bold uppercase text-gray-500">{label}</span></div>
            <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 print:border-gray-400`}><span className={`text-[10px] font-black ${S.color}`}>{S.id}</span></div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 mb-2"><StatusIcon size={16} className={S.color} /><span className={`text-sm font-black ${S.color}`}>{S.name}</span></div>
        <div className={`text-[10px] font-bold mb-2 ${S.color} opacity-80 uppercase`}>{S.action}</div>
        
        {/* RSI Section - Clickable */}
        <div 
            className={`flex items-center justify-between mb-2 px-1.5 py-0.5 rounded border ${rsiBg} cursor-pointer transition-colors group`}
            onClick={() => onRsiClick(rsi, label)}
            title="Clic para explicar RSI"
        >
            <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1 group-hover:text-gray-700"><Activity size={8}/> RSI</span>
            <span className={`text-[10px] font-black ${rsiColor}`}>{rsi.toFixed(1)}</span>
        </div>

        <div className="mt-auto pt-2 border-t border-black/5 space-y-1">
             <div className="flex justify-between items-center text-[9px]">
                <span className="text-red-700 font-bold flex items-center gap-0.5"><ArrowUpToLine size={8}/> R1</span>
                <span className="font-mono font-black text-gray-900">{formatPrice(pivots.r1)}</span>
             </div>
             <div className="flex justify-between items-center text-[9px]">
                <span className="text-emerald-700 font-bold flex items-center gap-0.5"><ArrowDownToLine size={8}/> S1</span>
                <span className="font-mono font-black text-gray-900">{formatPrice(pivots.s1)}</span>
             </div>
        </div>
      </div>
    );
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

// Helper to restore React components (Icons) lost in JSON serialization
const rehydrateData = (data: MarketData): MarketData => {
    const restoreStage = (tfAnalysis: TimeframeAnalysis | null) => {
        if (!tfAnalysis || !tfAnalysis.stage) return;
        const id = tfAnalysis.stage.id;
        if (STAGES[id]) {
            tfAnalysis.stage = STAGES[id]; // Restores the full object including the 'icon' component
        }
    };

    restoreStage(data.daily);
    restoreStage(data.weekly);
    restoreStage(data.monthly);
    return data;
};

const AssetCard: React.FC<Props> = ({ asset, onDelete, onToggleFavorite, refreshTrigger, onMove, index, total, currency, rate, isFixed = false, apiKey, onRequireKey }) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for AI and Modals
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [matrixInsight, setMatrixInsight] = useState<string | null>(null); 
  const [matrixLoading, setMatrixLoading] = useState(false);

  const [profilesAnalysis, setProfilesAnalysis] = useState<string | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);

  const [showChart, setShowChart] = useState(false);
  const [showFundamental, setShowFundamental] = useState(false); 
  const [showMA20, setShowMA20] = useState(false);
  
  // New RSI Modal State
  const [rsiModalData, setRsiModalData] = useState<{value: number, timeframe: string} | null>(null);

  // Track component mount status to prevent state updates on unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async (useCache: boolean) => {
    setLoading(true); setError(null); setAiAnalysis(null); setProfilesAnalysis(null); setMatrixInsight(null);
    
    const cacheKey = `cgo_cache_${asset.symbol}_${asset.type || 'CRYPTO'}`;

    // 1. Try to load from Cache
    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data: cachedData } = JSON.parse(cached);
                // Check if valid (< 1 hour)
                if (Date.now() - timestamp < CACHE_DURATION) {
                    if (isMounted.current) {
                        // CRITICAL: Rehydrate the data to restore icon components
                        setData(rehydrateData(cachedData));
                        setLoading(false);
                    }
                    return; // Stop here, use cache
                }
            } catch (e) {
                console.warn("Invalid cache for", asset.symbol);
            }
        }
    }

    // 2. Fetch fresh data
    try {
        const marketData = await fetchAssetData(asset.symbol, asset.type);
        if (isMounted.current) {
            setData(marketData);
            // Save to cache (icons will be lost here, but rehydrated on load)
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: marketData }));
        }
    } catch (err) { 
        console.error(err);
        if (isMounted.current) setError('Error de datos'); 
    } finally { 
        if (isMounted.current) setLoading(false); 
    }
  };

  // Initial Load (Use Cache)
  useEffect(() => { 
      fetchData(true); 
  }, [asset.symbol, asset.type]);

  // Force Refresh (Bypass Cache)
  useEffect(() => {
      if (refreshTrigger > 0) {
          fetchData(false);
      }
  }, [refreshTrigger]);

  // -- AI HELPERS --
  const validateKey = () => {
      if (!apiKey) {
          onRequireKey();
          return false;
      }
      return true;
  };

  const callGeminiOracle = async () => { 
    if (!data || !validateKey()) return;
    setAiLoading(true);
    try {
        const prompt = `
        Actúa como analista senior experto en Método CRIPTOGO.
        Analiza el activo: ${asset.name} (${asset.symbol}). Tipo: ${asset.type || 'CRYPTO'}.
        DATOS TÉCNICOS: Precio ${data.daily.price}, RSI: ${data.daily.rsi.toFixed(1)}, Diario ${data.daily.stage.name}, Semanal ${data.weekly?.stage.name}, Mensual ${data.monthly?.stage.name}.
        
        INSTRUCCIÓN DE FORMATO:
        Usa caracteres UNICODE MATEMÁTICOS (Negrita serif, Cursiva) para títulos y énfasis. NO USES MARKDOWN (**).
        Ejemplo: 𝐀𝐍𝐀́𝐋𝐈𝐒𝐈𝐒 𝐃𝐄 𝐀𝐋𝐈𝐍𝐄𝐀𝐂𝐈𝐎́𝐍, 𝐷𝑖𝑎𝑔𝑛𝑜́𝑠𝑡𝑖𝑐𝑜.
        
        FORMATO DE RESPUESTA:
        𝐀𝐍𝐀́𝐋𝐈𝐒𝐈𝐒 𝐃𝐄 𝐀𝐋𝐈𝐍𝐄𝐀𝐂𝐈𝐎́𝐍
        ━━━━━━━━━━━━━━━━━━━━━━
        • Diagnóstico: [Evaluación técnica concisa]
        • Nivel de Riesgo: [Bajo/Medio/Alto/Extremo]
        
        𝐕𝐄𝐑𝐄𝐃𝐈𝐂𝐓𝐎 𝐓𝐀́𝐂𝐓𝐈𝐂𝐎: [ACCIÓN RECOMENDADA EN MAYÚSCULAS]
        
        (Máximo 50 palabras. Tono profesional. Sin Emojis).
      `;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setAiAnalysis(text);
    } catch(e) { 
        if (String(e).includes('API_MISSING') || String(e).includes('403') || String(e).includes('key')) {
             onRequireKey();
        }
        else if (isMounted.current) setAiAnalysis("Error de conexión con IA."); 
    } finally { 
        if (isMounted.current) setAiLoading(false); 
    }
  };

  const callGeminiProfiles = async () => { 
    if (!data || !validateKey()) return;
    setProfilesLoading(true); setShowProfiles(true);
    try {
        const prompt = `
        Actúa como asesor financiero experto en Método CRIPTOGO.
        Analiza el activo: ${asset.name} (${asset.symbol}). Tipo: ${asset.type || 'CRYPTO'}.
        Datos: D:${data.daily.stage.name}, RSI:${data.daily.rsi.toFixed(1)}, S:${data.weekly?.stage.name}, M:${data.monthly?.stage.name}.

        INSTRUCCIÓN DE FORMATO:
        Usa caracteres UNICODE MATEMÁTICOS (Negrita serif) para los títulos de perfil. NO USES MARKDOWN (**).
        Ejemplo: 𝐏𝐄𝐑𝐅𝐈𝐋 𝐂𝐎𝐍𝐒𝐄𝐑𝐕𝐀𝐃𝐎𝐑.

        FORMATO ESTRICTO:

        𝐏𝐄𝐑𝐅𝐈𝐋 𝐂𝐎𝐍𝐒𝐄𝐑𝐕𝐀𝐃𝐎𝐑 (Bajo Riesgo)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Consejo: [Acción: Esperar / Entrar / Abstenerse]
        • Razón: [Justificación técnica breve]

        𝐏𝐄𝐑𝐅𝐈𝐋 𝐌𝐎𝐃𝐄𝐑𝐀𝐃𝐎 (Medio Riesgo)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Consejo: [Acción específica]
        • Razón: [Justificación breve]

        𝐏𝐄𝐑𝐅𝐈𝐋 𝐀𝐆𝐑𝐄𝐒𝐈𝐕𝐎 (Alto Riesgo)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Consejo: [Acción específica]
        • Razón: [Justificación breve]

        (Tono ejecutivo. Máximo 150 palabras total. Español. Sin Emojis).
      `;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setProfilesAnalysis(text);
    } catch(e) { 
        if (String(e).includes('API_MISSING') || String(e).includes('403') || String(e).includes('key')) {
             onRequireKey();
        }
        else if (isMounted.current) setProfilesAnalysis("Error."); 
    } finally { 
        if (isMounted.current) setProfilesLoading(false); 
    }
  };

  const getMatrixInsight = async () => {
    if (!data) return;
    if (!validateKey()) return; 
    
    if (isMounted.current) setMatrixLoading(true);
    try {
        const prompt = `
            Analiza la coherencia de estas 3 etapas CriptoGO para ${asset.symbol} (${asset.type || 'CRYPTO'}): 
            Diario:${data.daily.stage.name} (RSI: ${data.daily.rsi.toFixed(1)}), 
            Semanal:${data.weekly?.stage.name}, 
            Mensual:${data.monthly?.stage.name}.
            Genera UNA sola frase corta y directa (max 15 palabras) resumiendo oportunidad/riesgo.
            Sin emojis. Tono serio.
        `;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setMatrixInsight(text);
    } catch(e) { 
        if (String(e).includes('API_MISSING') || String(e).includes('403') || String(e).includes('key')) {
             onRequireKey();
        }
        else if (isMounted.current) setMatrixInsight("Error (Reintentar)"); 
    } finally { 
        if (isMounted.current) setMatrixLoading(false); 
    }
  };

  const handleRsiClick = (val: number | undefined, label: string) => {
      if (val !== undefined) {
          setRsiModalData({ value: val, timeframe: label });
      }
  };

  if (loading) return <div className={`p-6 rounded-lg border ${COLORS.border} ${COLORS.card} animate-pulse`}><div className="h-4 bg-gray-200 w-24 rounded mb-2"></div><div className="h-8 bg-gray-100 w-full rounded"></div></div>;
  if (error || !data) return <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex justify-between"><span className="font-bold text-red-900">{asset.symbol}</span><button onClick={() => onDelete(asset.symbol)} className="print:hidden"><Trash2 size={18} /></button></div>;

  const { daily, weekly, monthly } = data;
  const dist = daily.ma20 ? ((daily.price - daily.ma20) / daily.ma20) * 100 : 0;
  
  const curConf = CURRENCIES[currency];
  const convertedPrice = daily.price * rate;
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  
  const isStock = asset.type === 'STOCK';
  const sourceLabel = isStock ? 'YAHOO' : 'BINANCE';
  const SourceIcon = isStock ? Building2 : Info;

  return (
    <>
      <div className={`p-5 rounded-lg border ${isFixed ? 'border-l-4 border-l-gray-900' : ''} ${asset.isFavorite ? 'border-amber-300 ring-1 ring-amber-100' : COLORS.border} ${COLORS.card} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden print:shadow-none print:border-black print:break-inside-avoid`}>
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => onToggleFavorite(asset.symbol)} 
                    className={`transition-colors ${asset.isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-300'} print:hidden`}
                    title={asset.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                    <Star size={18} fill={asset.isFavorite ? "currentColor" : "none"} />
                </button>

                <div className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" onClick={() => setShowFundamental(true)} title="Ver Análisis Fundamental">
                  <h3 className={`text-xl font-black ${COLORS.textMain} group-hover:underline decoration-2 decoration-gray-300`}>{asset.symbol}</h3>
                  <span className={`text-[10px] ${isStock ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'} px-1.5 py-0.5 rounded border font-mono flex items-center gap-1 print:hidden`}>
                    {sourceLabel} <SourceIcon size={10} className={isStock ? 'text-blue-500' : 'text-gray-400'}/>
                  </span>
                </div>
            </div>
            <p className={`text-xs font-medium ${COLORS.textSub} mt-1 ml-6`}>{asset.name}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-bold ${COLORS.textMain} tracking-tight`}>{convertedPrice.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits })}</p>
            <p 
                onClick={() => setShowMA20(true)}
                className={`text-xs font-bold ${dist >= 0 ? 'text-emerald-700' : 'text-red-700'} cursor-help hover:underline decoration-dotted underline-offset-2`}
                title="Clic para saber más sobre la MA20"
            >
                {dist > 0 ? '▲' : '▼'} {Math.abs(dist).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% vs MA20
            </p>
          </div>
        </div>

        {/* MATRIX */}
        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periodo (Multi-Timeframe)</p>
             <button 
                onClick={getMatrixInsight} 
                disabled={matrixLoading}
                className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 transition-all hover:border-indigo-300 print:hidden"
                title="Analizar coherencia de la matriz con IA"
             >
                {matrixLoading ? <Loader2 size={10} className="animate-spin"/> : <Zap size={10} fill={matrixInsight ? "currentColor" : "none"}/>}
                {matrixInsight ? 'REVISAR' : 'INSIGHT'}
             </button>
          </div>
          
          <div className="flex gap-2">
              <PhaseBadge label="Diario" analysis={daily} icon={Calendar} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
              <PhaseBadge label="Semanal" analysis={weekly} icon={CalendarDays} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
              <PhaseBadge label="Mensual" analysis={monthly} icon={CalendarRange} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
          </div>

          {/* ALIGNED ANALYSIS BUTTONS */}
          <div className="flex gap-2 mt-2 print:hidden">
            <button onClick={callGeminiOracle} disabled={aiLoading} className={`${COLORS.btnAi} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all disabled:opacity-70 hover:shadow`}>
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} ORÁCULO
            </button>
            <button onClick={callGeminiProfiles} className={`${COLORS.btnProfiles} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all hover:shadow`}>
                <Users size={12} /> PERFILES
            </button>
            <button onClick={() => setShowChart(true)} className={`${COLORS.btnChart} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all hover:shadow`}>
                <LineChart size={12} className="text-gray-600"/> GRÁFICO
            </button>
          </div>

          {/* INSIGHT RÁPIDO IN-LINE */}
          {matrixInsight && (
              <div className="mt-2 bg-indigo-50 border-l-2 border-indigo-500 p-2 rounded-r text-xs text-indigo-900 font-medium animate-in fade-in slide-in-from-top-1 flex justify-between items-center print:border-gray-300 print:bg-white print:text-black">
                  <span>{matrixInsight}</span>
                  <button onClick={() => setMatrixInsight(null)} className="text-indigo-300 hover:text-indigo-600 ml-2 print:hidden"><X size={12}/></button>
              </div>
          )}
        </div>
        
        {/* FOOTER MANAGEMENT */}
        <div className="mt-3 border-t border-gray-100 pt-2 flex justify-end items-center print:hidden">
          <div className="flex gap-2 items-center">
              {!isFixed && (
                  <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200 mr-1">
                    <button onClick={() => onMove(index, 'left')} disabled={index === 0} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all"><ChevronLeft size={14} className="text-gray-600"/></button>
                    <button onClick={() => onMove(index, 'right')} disabled={index === total - 1} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all"><ChevronRight size={14} className="text-gray-600"/></button>
                  </div>
              )}
              <button onClick={() => fetchData(false)} className="text-gray-400 hover:text-gray-900 p-1"><RefreshCw size={14} /></button>
              {isFixed ? (
                 <div className="p-1 text-gray-300" title="Activo fijo del sistema"><Lock size={14} /></div>
              ) : (
                 <button onClick={() => onDelete(asset.symbol)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
              )}
          </div>
        </div>
      </div>
      {aiAnalysis && <OracleModal symbol={asset.symbol} analysis={aiAnalysis} onClose={() => setAiAnalysis(null)} />}
      {showFundamental && <FundamentalModal asset={asset} onClose={() => setShowFundamental(false)} />}
      {showProfiles && (profilesLoading || profilesAnalysis ? (<ProfilesModal symbol={asset.symbol} analysis={profilesAnalysis || "Analizando perfiles..."} onClose={() => { setShowProfiles(false); setProfilesAnalysis(null); }} />) : null)}
      {showChart && <ChartModal symbol={asset.symbol} type={asset.type || 'CRYPTO'} onClose={() => setShowChart(false)} />}
      {showMA20 && <MA20Modal symbol={asset.symbol} price={daily.price} ma20={daily.ma20} onClose={() => setShowMA20(false)} />}
      {rsiModalData && <RSIModal symbol={asset.symbol} value={rsiModalData.value} timeframe={rsiModalData.timeframe} onClose={() => setRsiModalData(null)} />}
    </>
  );
};

export default AssetCard;