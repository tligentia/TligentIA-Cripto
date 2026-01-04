
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, Calendar, CalendarDays, CalendarRange, Sparkles, Users, LineChart, Loader2, Zap, ArrowUpToLine, ArrowDownToLine, ChevronLeft, ChevronRight, X, Building2, Lock, Star, Activity } from 'lucide-react';
import { Asset, MarketData, TimeframeAnalysis, CurrencyCode } from '../types';
import { CURRENCIES } from '../constants';
import { fetchAssetData } from '../services/market';
import { generateGeminiContent } from '../services/gemini';
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
  // Fix: changed from void to () => void to allow it to be called as a function
  onRequireKey: () => void;
}

const PhaseBadge: React.FC<{ 
    label: string; 
    analysis: TimeframeAnalysis | null; 
    icon: React.ElementType; 
    currency: CurrencyCode; 
    rate: number;
    onRsiClick: (val: number, label: string) => void;
    isLarge?: boolean;
}> = ({ label, analysis, icon: Icon, currency, rate, onRsiClick, isLarge }) => {
    if (!analysis) return <div className={isLarge ? "text-xl text-gray-400" : "text-xs text-gray-400"}>N/A</div>;
    
    const S = analysis.stage;
    if (!S || !S.icon) return <div className={isLarge ? "text-xl text-gray-400" : "text-xs text-gray-400"}>Err</div>;

    const StatusIcon = S.icon;
    const { pivots, rsi } = analysis;
    const curConf = CURRENCIES[currency];

    const formatPrice = (val: number) => {
       const converted = val * rate;
       const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
       return converted.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    if (isLarge) {
        return (
            <div className={`flex flex-col p-6 rounded-[32px] border-4 ${S.bg} flex-1 transition-all shadow-xl`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <Icon size={24} className="text-gray-400" />
                        <span className="text-xl font-black uppercase tracking-tighter text-gray-500">{label}</span>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md border-2 border-black/5">
                        <span className={`text-xl font-black ${S.color}`}>{S.id}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-2 mb-2">
                    <StatusIcon size={36} className={S.color} />
                    <span className={`text-3xl font-black ${S.color}`}>{S.name}</span>
                </div>
                <div className={`text-lg font-bold mb-4 ${S.color} opacity-80 uppercase tracking-widest`}>{S.action}</div>
                
                <div 
                    className={`flex items-center justify-between mb-4 px-4 py-3 rounded-2xl border ${rsi >= 70 || rsi <= 30 ? (rsi >= 70 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100') : 'bg-gray-50 border-gray-100'} cursor-pointer`}
                    onClick={(e) => { e.stopPropagation(); onRsiClick(rsi, label); }}
                >
                    <span className="text-sm font-bold text-gray-400 flex items-center gap-2"><Activity size={16}/> RSI</span>
                    <span className={`text-xl font-black ${rsi >= 70 ? 'text-red-600' : (rsi <= 30 ? 'text-emerald-600' : 'text-gray-500')}`}>{rsi.toFixed(1)}</span>
                </div>

                <div className="pt-4 border-t-2 border-black/5 space-y-3">
                     <div className="flex justify-between items-center">
                        <span className="text-red-700 font-bold flex items-center gap-2 text-sm"><ArrowUpToLine size={16}/> R1</span>
                        <span className="font-mono font-black text-gray-900 text-xl">{formatPrice(pivots.r1)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-bold flex items-center gap-2 text-sm"><ArrowDownToLine size={16}/> S1</span>
                        <span className="font-mono font-black text-gray-900 text-xl">{formatPrice(pivots.s1)}</span>
                     </div>
                </div>
            </div>
        );
    }

    return (
      <div className={`flex flex-col p-2 rounded-xl border ${S.bg} flex-1 transition-all hover:scale-[1.02] cursor-default hover:shadow-md group relative`}>
        <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1"><Icon size={12} className="text-gray-400" /><span className="text-[10px] font-bold uppercase text-gray-400">{label}</span></div>
            <div className={`flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm border border-black/5`}><span className={`text-[10px] font-black ${S.color}`}>{S.id}</span></div>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 mb-1"><StatusIcon size={16} className={S.color} /><span className={`text-sm font-black ${S.color}`}>{S.name}</span></div>
        <div className={`text-[10px] font-bold mb-1 ${S.color} opacity-80 uppercase tracking-tight`}>{S.action}</div>
        
        <div 
            className={`flex items-center justify-between mb-1 px-1.5 py-1 rounded-lg border ${rsi >= 70 || rsi <= 30 ? (rsi >= 70 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100') : 'bg-gray-50 border-gray-100'} cursor-pointer transition-colors group/rsi`}
            onClick={(e) => { e.stopPropagation(); onRsiClick(rsi, label); }}
        >
            <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 group-hover/rsi:text-gray-600"><Activity size={8}/> RSI</span>
            <span className={`text-[10px] font-black ${rsi >= 70 ? 'text-red-600' : (rsi <= 30 ? 'text-emerald-600' : 'text-gray-500')}`}>{rsi.toFixed(1)}</span>
        </div>

        <div className="mt-auto pt-1 border-t border-black/5 space-y-1">
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

const AssetCard: React.FC<Props> = ({ asset, onDelete, onToggleFavorite, refreshTrigger, onMove, index, total, currency, rate, isFixed = false, apiKey, onRequireKey }) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [matrixInsight, setMatrixInsight] = useState<string | null>(null); 
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showFundamental, setShowFundamental] = useState(false); 
  const [showMA20, setShowMA20] = useState(false);
  const [rsiModalData, setRsiModalData] = useState<{value: number, timeframe: string} | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    if (isZoomed) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  const fetchData = async (useCache: boolean) => {
    setLoading(true); setError(null);
    try {
        const marketData = await fetchAssetData(asset.symbol, asset.type);
        if (isMounted.current) setData(marketData);
    } catch (err) { 
        if (isMounted.current) setError('Error de datos'); 
    } finally { 
        if (isMounted.current) setLoading(false); 
    }
  };

  useEffect(() => { fetchData(true); }, [asset.symbol, asset.type]);
  useEffect(() => { if (refreshTrigger > 0) fetchData(false); }, [refreshTrigger]);

  const callGeminiOracle = async () => { 
    // Fix: onRequireKey is now a function and can be called
    if (!apiKey) { onRequireKey(); return; }
    if (!data) return;
    setAiLoading(true);
    try {
        const prompt = `Analiza ${asset.symbol}. Datos: P:${data.daily.price}, RSI:${data.daily.rsi.toFixed(1)}. Max 50 palabras. Sin Markdown.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) {
            setAiAnalysis(text);
        }
    } finally { if (isMounted.current) setAiLoading(false); }
  };

  const getMatrixInsight = async () => {
    // Fix: onRequireKey is now a function and can be called
    if (!apiKey) { onRequireKey(); return; }
    if (!data) return;
    setMatrixLoading(true);
    try {
        const prompt = `Resume riesgo/oportunidad para ${asset.symbol} en una frase.`;
        const text = await generateGeminiContent(prompt, apiKey);
        if (isMounted.current) setMatrixInsight(text);
    } finally { if (isMounted.current) setMatrixLoading(false); }
  };

  const handleOpenFundamental = () => {
      // Fix: onRequireKey is now a function and can be called
      if (!apiKey) { onRequireKey(); return; }
      setShowFundamental(true);
  };

  const handleOpenProfiles = () => {
      // Fix: onRequireKey is now a function and can be called
      if (!apiKey) { onRequireKey(); return; }
      setShowProfiles(true);
  };

  const handleRsiClick = (val: number | undefined, label: string) => {
      if (val !== undefined) setRsiModalData({ value: val, timeframe: label });
  };

  if (loading) return <div id={`asset-card-${asset.symbol}`} className="p-6 rounded-lg border border-gray-200 bg-white animate-pulse h-64" />;
  if (error || !data) return <div id={`asset-card-${asset.symbol}`} className="p-4 rounded-lg border border-red-200 bg-red-50 flex justify-between"><span className="font-bold text-red-900">{asset.symbol}</span><button onClick={() => onDelete(asset.symbol)}><Trash2 size={18} /></button></div>;

  const { daily, weekly, monthly } = data;
  const dist = daily.ma20 ? ((daily.price - daily.ma20) / daily.ma20) * 100 : 0;
  const curConf = CURRENCIES[currency];
  const convertedPrice = daily.price * rate;
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  const formatPriceFull = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: curConf.code, minimumFractionDigits: digits, maximumFractionDigits: digits });

  const ticker = asset.symbol;
  const aiPrompt = encodeURIComponent(`Analiza de forma experta el activo ${asset.symbol} (${asset.name}). Proporciona un diagnóstico técnico y fundamental detallado.`);

  const cardContent = (isLarge: boolean) => (
    <div 
      id={`asset-card-${asset.symbol}`}
      className={`${isLarge ? 'p-10 md:p-16' : 'p-5'} rounded-lg border ${asset.isFavorite ? 'border-gray-900 ring-1 ring-gray-100' : 'border-gray-200'} bg-white shadow-sm transition-all relative overflow-hidden h-full flex flex-col scroll-mt-32`}
    >
      <div className={`flex justify-between items-start ${isLarge ? 'mb-10' : 'mb-3'}`}>
        <div className="cursor-pointer group" onClick={() => setIsZoomed(isLarge ? false : true)}>
          <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.symbol); }} className={`transition-colors ${asset.isFavorite ? 'text-gray-900' : 'text-gray-200'} ${isLarge ? 'scale-150 mr-4' : ''}`}><Star size={isLarge ? 24 : 18} fill={asset.isFavorite ? "currentColor" : "none"} /></button>
              <div className="flex items-center gap-2">
                <h3 className={`${isLarge ? 'text-6xl' : 'text-xl'} font-black text-gray-900 group-hover:underline`}>{asset.symbol}</h3>
                <span className={`${isLarge ? 'text-xl px-4 py-2' : 'text-[10px] px-1.5 py-0.5'} bg-gray-50 text-gray-400 border border-gray-100 rounded font-mono`}>{asset.type === 'STOCK' ? 'YAHOO' : 'BINANCE'}</span>
              </div>
          </div>
          <p className={`${isLarge ? 'text-2xl mt-4 ml-12' : 'text-xs mt-1 ml-6'} font-medium text-gray-500`}>{asset.name}</p>
        </div>
        <div className="text-right">
          <p className={`${isLarge ? 'text-6xl' : 'text-2xl'} font-mono font-bold text-gray-900 tracking-tight`}>{formatPriceFull(convertedPrice)}</p>
          <p onClick={() => setShowMA20(true)} className={`${isLarge ? 'text-xl mt-4' : 'text-xs mt-1'} font-bold ${dist >= 0 ? 'text-red-700' : 'text-gray-500'} cursor-help hover:underline`}>{dist > 0 ? '▲' : '▼'} {Math.abs(dist).toFixed(2)}% vs MA20</p>
        </div>
      </div>

      <div className={`${isLarge ? 'mb-6' : 'mb-3'} flex-1 flex flex-col`}>
        <div className={`flex justify-between items-end ${isLarge ? 'mb-6' : 'mb-1.5'}`}>
           <p className={`${isLarge ? 'text-xl' : 'text-[10px]'} font-bold text-gray-400 uppercase tracking-widest`}>Periodo (Multi-Timeframe)</p>
           {!isLarge && (
             <button onClick={(e) => { e.stopPropagation(); setShowChart(true); }} className="text-[10px] flex items-center gap-1 text-gray-900 hover:text-black font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                <LineChart size={10} className="text-red-700"/> GRÁFICO
             </button>
           )}
        </div>
        <div className={`flex ${isLarge ? 'gap-6' : 'gap-2'}`}>
            <PhaseBadge label="Diario" isLarge={isLarge} analysis={daily} icon={Calendar} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
            <PhaseBadge label="Semanal" isLarge={isLarge} analysis={weekly} icon={CalendarDays} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
            <PhaseBadge label="Mensual" isLarge={isLarge} analysis={monthly} icon={CalendarRange} currency={currency} rate={rate} onRsiClick={handleRsiClick} />
        </div>
        
        {!isLarge && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={callGeminiOracle} disabled={aiLoading} className="py-2 rounded-md bg-slate-950 text-white text-[10px] font-bold flex justify-center items-center gap-1 uppercase tracking-widest hover:bg-slate-800 transition-colors">{aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Oráculo</button>
              <button onClick={getMatrixInsight} disabled={matrixLoading} className="py-2 rounded-md bg-red-950 text-white text-[10px] font-bold flex justify-center items-center gap-1 uppercase tracking-widest hover:bg-red-800 transition-colors">
                {matrixLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill={matrixInsight ? "currentColor" : "none"} />} Insight</button>
              <button onClick={handleOpenFundamental} className="py-2 rounded-md bg-blue-950 text-white text-[10px] font-bold flex justify-center items-center gap-1 uppercase tracking-widest hover:bg-blue-800 transition-colors"><Building2 size={12} /> Fundamental</button>
              <button onClick={handleOpenProfiles} className="py-2 rounded-md bg-emerald-950 text-white text-[10px] font-bold flex justify-center items-center gap-1 uppercase tracking-widest hover:bg-emerald-800 transition-colors"><Users size={12} /> Estrategias</button>
            </div>
          </>
        )}

        {matrixInsight && !isLarge && (
          <div className="mt-2 p-2 text-xs bg-gray-50 border-l-4 border-red-900 rounded-r text-gray-900 font-medium flex justify-between items-start animate-in slide-in-from-left duration-300">
            <div className="flex-1 pr-2">
              <span className="block text-[8px] font-bold text-red-900 uppercase mb-1">Insight de Mercado:</span>
              <div className="font-sans leading-relaxed">{matrixInsight}</div>
            </div>
            <button onClick={() => setMatrixInsight(null)} className="text-gray-300 hover:text-gray-600 pt-0.5"><X size={12}/></button>
          </div>
        )}

        {aiAnalysis && !isLarge && (
          <div className="mt-2 p-2 text-xs bg-gray-50 border-l-4 border-slate-950 rounded-r text-gray-900 font-medium flex justify-between items-start animate-in slide-in-from-left duration-300">
            <div className="flex-1 pr-2">
              <span className="block text-[8px] font-bold text-slate-950 uppercase mb-1">Análisis del Oráculo:</span>
              <div className="font-sans leading-relaxed">{aiAnalysis}</div>
            </div>
            <button onClick={() => setAiAnalysis(null)} className="text-gray-300 hover:text-gray-600 pt-0.5"><X size={12}/></button>
          </div>
        )}
      </div>
      
      {!isLarge && (
        <div className="mt-4 border-t border-gray-100 pt-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                  <a href={`https://www.tradingview.com/chart/?symbol=${ticker}`} target="_blank" rel="noreferrer" title="TradingView" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-chart-line text-[11px]"></i>
                  </a>
                  <a href={`https://finance.yahoo.com/quote/${ticker}`} target="_blank" rel="noreferrer" title="Yahoo Finanzas" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-brands fa-yahoo text-[11px]"></i>
                  </a>
                  <a href={`https://es.investing.com/search/?q=${ticker}`} target="_blank" rel="noreferrer" title="Investing.com" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-dollar-sign text-[11px]"></i>
                  </a>
                  <a href={`https://app.koyfin.com/search?q=${ticker}`} target="_blank" rel="noreferrer" title="Koyfin" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-magnifying-glass-chart text-[11px]"></i>
                  </a>
              </div>
              
              <div className="w-px h-3 bg-gray-100"></div>

              <div className="flex items-center gap-2.5">
                  <a href={`https://chat.openai.com/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar ChatGPT" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-robot text-[11px]"></i>
                  </a>
                  <a href={`https://grok.com/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar Grok" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-bolt text-[11px]"></i>
                  </a>
                  <a href={`https://www.perplexity.ai/?q=${aiPrompt}`} target="_blank" rel="noreferrer" title="Consultar Perplexity" className="text-blue-900 hover:text-red-700 transition-all">
                      <i className="fa-solid fa-infinity text-[11px]"></i>
                  </a>
              </div>
          </div>

          <div className="flex gap-2 items-center">
              {!isFixed && (
                  <div className="flex bg-gray-100 rounded-md p-0.5 border border-gray-200 mr-1">
                    <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'left'); }} disabled={index === 0} className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-600"><ChevronLeft size={10} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'right'); }} disabled={index === total - 1} className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-600"><ChevronRight size={10} /></button>
                  </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); fetchData(false); }} className="text-gray-600 hover:text-gray-900 p-1"><RefreshCw size={14} /></button>
              {isFixed ? <div className="p-1 text-gray-300"><Lock size={14} /></div> : <button onClick={(e) => { e.stopPropagation(); onDelete(asset.symbol); }} className="text-gray-600 hover:text-red-700 p-1"><Trash2 size={14} /></button>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="h-full">
        {cardContent(false)}
      </div>

      {isZoomed && (
          <div className="fixed inset-0 z-[110] bg-white animate-in fade-in zoom-in duration-300 flex flex-col overflow-y-auto">
              <button 
                  onClick={() => setIsZoomed(false)} 
                  className="absolute top-10 right-10 p-4 hover:bg-red-50 rounded-full transition-all text-red-600 border-2 border-red-100 z-[120] bg-white shadow-sm"
              >
                  <X size={32} strokeWidth={3} />
              </button>
              <div className="flex-1 w-full max-w-[1400px] mx-auto p-8 md:p-16">
                  {cardContent(true)}
              </div>
          </div>
      )}

      {showFundamental && <FundamentalModal asset={asset} apiKey={apiKey} onClose={() => setShowFundamental(false)} />}
      {showProfiles && <ProfilesModal symbol={asset.symbol} apiKey={apiKey} rsiValue={daily?.rsi} onClose={() => setShowProfiles(false)} />}
      {showChart && <ChartModal symbol={asset.symbol} type={asset.type || 'CRYPTO'} onClose={() => setShowChart(false)} />}
      {showMA20 && <MA20Modal symbol={asset.symbol} price={daily.price} ma20={daily.ma20} onClose={() => setShowMA20(false)} />}
      {rsiModalData && <RSIModal symbol={asset.symbol} value={rsiModalData.value} timeframe={rsiModalData.timeframe} onClose={() => setRsiModalData(null)} />}
    </>
  );
};

export default AssetCard;
