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
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  isFixed?: boolean;
  apiKey: string;
  onRequireKey: () => void;
}

const PhaseBadge: React.FC<{ 
    label: string; 
    analysis: TimeframeAnalysis | null; 
    icon: React.ElementType; 
    currency: CurrencyCode; 
    rate: number;
    onRsiClick: (val: number, label: string) => void;
}> = ({ label, analysis, icon: Icon, currency, rate, onRsiClick }) => {
    if (!analysis) return <div className="text-xs text-gray-400">N/A</div>;
    
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

    let rsiColor = "text-gray-500";
    let rsiBg = "bg-gray-50 border-gray-100 hover:bg-gray-100";
    if (rsi >= 70) {
        rsiColor = "text-red-600";
        rsiBg = "bg-red-50 border-red-100 hover:bg-red-100";
    } else if (rsi <= 30) {
        rsiColor = "text-gray-900";
        rsiBg = "bg-gray-100 border-gray-200 hover:bg-gray-200";
    }

    return (
      <div className={`flex flex-col p-2 rounded border border-gray-100 ${S.bg} flex-1 print:bg-white print:border-gray-300`}>
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1"><Icon size={12} className="text-gray-400" /><span className="text-[10px] font-bold uppercase text-gray-400">{label}</span></div>
            <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm border border-gray-100 print:border-gray-400`}><span className={`text-[10px] font-black ${S.color}`}>{S.id}</span></div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 mb-2"><StatusIcon size={16} className={S.color} /><span className={`text-sm font-black ${S.color}`}>{S.name}</span></div>
        <div className={`text-[10px] font-bold mb-2 ${S.color} opacity-80 uppercase`}>{S.action}</div>
        
        <div 
            className={`flex items-center justify-between mb-2 px-1.5 py-0.5 rounded border ${rsiBg} cursor-pointer transition-colors group`}
            onClick={() => onRsiClick(rsi, label)}
            title="Clic para explicar RSI"
        >
            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 group-hover:text-gray-600"><Activity size={8}/> RSI</span>
            <span className={`text-[10px] font-black ${rsiColor}`}>{rsi.toFixed(1)}</span>
        </div>

        <div className="mt-auto pt-2 border-t border-black/5 space-y-1">
             <div className="flex justify-between items-center text-[9px]">
                <span className="text-red-700 font-bold flex items-center gap-0.5"><ArrowUpToLine size={8}/> R1</span>
                <span className="font-mono font-black text-gray-900">{formatPrice(pivots.r1)}</span>
             </div>
             <div className="flex justify-between items-center text-[9px]">
                <span className="text-gray-400 font-bold flex items-center gap-0.5"><ArrowDownToLine size={8}/> S1</span>
                <span className="font-mono font-black text-gray-900">{formatPrice(pivots.s1)}</span>
             </div>
        </div>
      </div>
    );
};

const CACHE_DURATION = 1000 * 60 * 60; 

const rehydrateData = (data: MarketData): MarketData => {
    const restoreStage = (tfAnalysis: TimeframeAnalysis | null) => {
        if (!tfAnalysis || !tfAnalysis.stage) return;
        const id = tfAnalysis.stage.id;
        if (STAGES[id]) {
            tfAnalysis.stage = STAGES[id];
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
  
  const [rsiModalData, setRsiModalData] = useState<{value: number, timeframe: string} | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = async (useCache: boolean) => {
    setLoading(true); setError(null); setAiAnalysis(null); setProfilesAnalysis(null); setMatrixInsight(null);
    const cacheKey = `cgo_cache_${asset.symbol}_${asset.type || 'CRYPTO'}`;

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const { timestamp, data: cachedData } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    if (isMounted.current) {
                        setData(rehydrateData(cachedData));
                        setLoading(false);
                    }
                    return; 
                }
            } catch (e) {
                console.warn("Invalid cache for", asset.symbol);
            }
        }
    }

    try {
        const marketData = await fetchAssetData(asset.symbol, asset.type);
        if (isMounted.current) {
            setData(marketData);
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: marketData }));
        }
    } catch (err) { 
        console.error(err);
        if (isMounted.current) setError('Error de datos'); 
    } finally { 
        if (isMounted.current) setLoading(false); 
    }
  };

  useEffect(() => { fetchData(true); }, [asset.symbol, asset.type]);

  useEffect(() => {
      if (refreshTrigger > 0) fetchData(false);
  }, [refreshTrigger]);

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
        const prompt = `Actúa como analista senior experto en Método CRIPTOGO. Analiza ${asset.name} (${asset.symbol}). Datos: P:${data.daily.price}, RSI:${data.daily.rsi.toFixed(1)}, D:${data.daily.stage.name}, S:${data.weekly?.stage.name}, M:${data.monthly?.stage.name}. Sin Markdown. Usa Unicode Bold. Max 50 palabras.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setAiAnalysis(text);
    } catch(e) { 
        if (String(e).includes('key')) onRequireKey();
        else if (isMounted.current) setAiAnalysis("Error IA."); 
    } finally { 
        if (isMounted.current) setAiLoading(false); 
    }
  };

  const callGeminiProfiles = async () => { 
    if (!data || !validateKey()) return;
    setProfilesLoading(true); setShowProfiles(true);
    try {
        const prompt = `Estrategia 3 perfiles para ${asset.symbol}. D:${data.daily.stage.name}, RSI:${data.daily.rsi.toFixed(1)}. Sin Markdown. Usa Unicode Bold. Max 150 palabras.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setProfilesAnalysis(text);
    } catch(e) { 
        if (String(e).includes('key')) onRequireKey();
        else if (isMounted.current) setProfilesAnalysis("Error."); 
    } finally { 
        if (isMounted.current) setProfilesLoading(false); 
    }
  };

  const getMatrixInsight = async () => {
    if (!data || !validateKey()) return;
    if (isMounted.current) setMatrixLoading(true);
    try {
        const prompt = `Resume riesgo/oportunidad para ${asset.symbol} en una frase (max 15 palabras) basada en estas etapas: D:${data.daily.stage.name}, S:${data.weekly?.stage.name}, M:${data.monthly?.stage.name}.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setMatrixInsight(text);
    } catch(e) { 
        if (String(e).includes('key')) onRequireKey();
        else if (isMounted.current) setMatrixInsight("Error"); 
    } finally { 
        if (isMounted.current) setMatrixLoading(false); 
    }
  };

  const handleRsiClick = (val: number | undefined, label: string) => {
      if (val !== undefined) setRsiModalData({ value: val, timeframe: label });
  };

  if (loading) return <div className={`p-6 rounded-lg border ${COLORS.border} ${COLORS.card} animate-pulse`}><div className="h-4 bg-gray-200 w-24 rounded mb-2"></div><div className="h-8 bg-gray-100 w-full rounded"></div></div>;
  if (error || !data) return <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex justify-between"><span className="font-bold text-red-900">{asset.symbol}</span><button onClick={() => onDelete(asset.symbol)} className="print:hidden"><Trash2 size={18} /></button></div>;

  const { daily, weekly, monthly } = data;
  const dist = daily.ma20 ? ((daily.price - daily.ma20) / daily.ma20) * 100 : 0;
  const curConf = CURRENCIES[currency];
  const convertedPrice = daily.price * rate;
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  const isStock = asset.type === 'STOCK';

  return (
    <>
      <div className={`p-5 rounded-lg border ${isFixed ? 'border-l-4 border-l-gray-900' : ''} ${asset.isFavorite ? 'border-gray-900 ring-1 ring-gray-100' : COLORS.border} ${COLORS.card} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden print:shadow-none print:border-black print:break-inside-avoid`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
                <button onClick={() => onToggleFavorite(asset.symbol)} className={`transition-colors ${asset.isFavorite ? 'text-gray-900 hover:text-black' : 'text-gray-200 hover:text-gray-400'} print:hidden`}><Star size={18} fill={asset.isFavorite ? "currentColor" : "none"} /></button>
                <div className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-all" onClick={() => setShowFundamental(true)}>
                  <h3 className={`text-xl font-black ${COLORS.textMain} group-hover:underline decoration-2 decoration-gray-300`}>{asset.symbol}</h3>
                  <span className={`text-[10px] ${isStock ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-50 text-gray-400 border-gray-100'} px-1.5 py-0.5 rounded border font-mono flex items-center gap-1 print:hidden`}>
                    {isStock ? 'YAHOO' : 'BINANCE'}
                  </span>
                </div>
            </div>
            <p className={`text-xs font-medium ${COLORS.textSub} mt-1 ml-6`}>{asset.name}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-mono font-bold ${COLORS.textMain} tracking-tight`}>{convertedPrice.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits })}</p>
            <p onClick={() => setShowMA20(true)} className={`text-xs font-bold ${dist >= 0 ? 'text-red-700' : 'text-gray-500'} cursor-help hover:underline decoration-dotted underline-offset-2`}>
                {dist > 0 ? '▲' : '▼'} {Math.abs(dist).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% vs MA20
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-end mb-2">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periodo (Multi-Timeframe)</p>
             <button onClick={getMatrixInsight} disabled={matrixLoading} className="text-[10px] flex items-center gap-1 text-gray-900 hover:text-black font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200 transition-all print:hidden">
                {matrixLoading ? <Loader2 size={10} className="animate-spin"/> : <Zap size={10} fill={matrixInsight ? "currentColor" : "none"}/>}
                {matrixInsight ? 'REVISAR' : 'INSIGHT'}
             </button>
          </div>
          <div className="flex gap-2">
              <PhaseBadge label="Diario" analysis={daily} icon={Calendar} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
              <PhaseBadge label="Semanal" analysis={weekly} icon={CalendarDays} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
              <PhaseBadge label="Mensual" analysis={monthly} icon={CalendarRange} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
          </div>
          <div className="flex gap-2 mt-2 print:hidden">
            <button onClick={callGeminiOracle} disabled={aiLoading} className={`${COLORS.btnAi} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all disabled:opacity-70 hover:shadow`}>
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} ORÁCULO
            </button>
            <button onClick={callGeminiProfiles} className={`${COLORS.btnProfiles} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all hover:shadow`}>
                <Users size={12} /> PERFILES
            </button>
            <button onClick={() => setShowChart(true)} className={`${COLORS.btnChart} flex-1 py-1.5 rounded-md text-[10px] font-bold flex justify-center items-center gap-1 shadow-sm transition-all hover:shadow`}>
                <LineChart size={12} className="text-gray-900"/> GRÁFICO
            </button>
          </div>
          {matrixInsight && (
              <div className="mt-2 bg-gray-50 border-l-2 border-gray-900 p-2 rounded-r text-xs text-gray-900 font-medium animate-in fade-in slide-in-from-top-1 flex justify-between items-center print:border-gray-300 print:bg-white print:text-black">
                  <span>{matrixInsight}</span>
                  <button onClick={() => setMatrixInsight(null)} className="text-gray-300 hover:text-gray-600 ml-2 print:hidden"><X size={12}/></button>
              </div>
          )}
        </div>
        <div className="mt-3 border-t border-gray-100 pt-2 flex justify-end items-center print:hidden">
          <div className="flex gap-2 items-center">
              {!isFixed && (
                  <div className="flex bg-gray-50 rounded-md p-0.5 border border-gray-200 mr-1">
                    <button onClick={() => onMove(asset.symbol, 'left')} disabled={index === 0} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all"><ChevronLeft size={14} className="text-gray-400"/></button>
                    <button onClick={() => onMove(asset.symbol, 'right')} disabled={index === total - 1} className="p-1 hover:bg-white hover:shadow-sm rounded disabled:opacity-30 transition-all"><ChevronRight size={14} className="text-gray-400"/></button>
                  </div>
              )}
              <button onClick={() => fetchData(false)} className="text-gray-300 hover:text-gray-900 p-1"><RefreshCw size={14} /></button>
              {isFixed ? <div className="p-1 text-gray-200"><Lock size={14} /></div> : <button onClick={() => onDelete(asset.symbol)} className="text-gray-300 hover:text-red-700 p-1"><Trash2 size={14} /></button>}
          </div>
        </div>
      </div>
      {aiAnalysis && <OracleModal symbol={asset.symbol} analysis={aiAnalysis} onClose={() => setAiAnalysis(null)} />}
      {showFundamental && <FundamentalModal asset={asset} apiKey={apiKey} onClose={() => setShowFundamental(false)} />}
      {showProfiles && (profilesLoading || profilesAnalysis ? (<ProfilesModal symbol={asset.symbol} analysis={profilesAnalysis || "Analizando perfiles..."} onClose={() => { setShowProfiles(false); setProfilesAnalysis(null); }} />) : null)}
      {showChart && <ChartModal symbol={asset.symbol} type={asset.type || 'CRYPTO'} onClose={() => setShowChart(false)} />}
      {showMA20 && <MA20Modal symbol={asset.symbol} price={daily.price} ma20={daily.ma20} onClose={() => setShowMA20(false)} />}
      {rsiModalData && <RSIModal symbol={asset.symbol} value={rsiModalData.value} timeframe={rsiModalData.timeframe} onClose={() => setRsiModalData(null)} />}
    </>
  );
};

export default AssetCard;