
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart3, Database, Sparkles, RefreshCw, Search, Plus, Loader2, AlertCircle, Activity, BrainCircuit, LayoutGrid } from 'lucide-react';
import { Asset, CurrencyCode, AssetType } from './types';
import { COLORS, DEFAULT_ASSETS, TOP_STOCKS, CURRENCIES, getAllowedIps } from './Plantilla/Parameters';
import { resolveAsset, fetchExchangeRates } from './services/market';
import { getSmartRecommendation } from './services/gemini';
import AssetCard from './components/AssetCard';
import FearGreedWidget from './components/FearGreedWidget';
import VixWidget from './components/VixWidget';
import { Seguridad } from './Plantilla/Seguridad';
import Footer from './Plantilla/Footer';
import { Cookies } from './Plantilla/Cookies';
import { Ajustes } from './Plantilla/Ajustes';
import CryptoCorrelationPro from './components/CryptoCorrelationPro';
import AiSuggestionModal from './components/AiSuggestionModal';
import GeneralDashboard from './components/GeneralDashboard';
import Guia from './components/Guia';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [showCookies, setShowCookies] = useState(false);
  const [showAjustes, setShowAjustes] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  
  const [view, setView] = useState<'overview' | 'dashboard' | 'correlation' | 'guia'>('overview');
  const [scrollToSymbol, setScrollToSymbol] = useState<string | null>(null);
  
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const wasAutoRefreshEnabledBeforeNav = useRef(true);
  const prevView = useRef<string>('overview');
  
  useEffect(() => {
    const checkIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
           const data = await res.json();
           setUserIp(data.ip);
           const allowed = getAllowedIps();
           if (allowed.includes(data.ip)) {
             setIsAuthenticated(true);
           }
        }
      } catch (e) {
        console.error("Auto-login failed:", e);
      }
    };
    checkIp();
  }, []);
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('criptogo_real_assets');
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('criptogo_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('criptogo_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  const [marketMode, setMarketMode] = useState<AssetType>(() => {
    const saved = localStorage.getItem('criptogo_market_mode');
    return (saved as AssetType) || 'CRYPTO';
  });

  const [apiKey, setApiKey] = useState<string>(() => {
      const stored = localStorage.getItem('criptogo_apikey');
      return (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 });
  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [aiSuggestionData, setAiSuggestionData] = useState<{symbol: string, reason: string, label: string} | null>(null);
  const [showAiReason, setShowAiReason] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showSmartCommands, setShowSmartCommands] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('criptogo_real_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('criptogo_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('criptogo_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('criptogo_market_mode', marketMode); }, [marketMode]);
  
  useEffect(() => { 
      if (apiKey && apiKey.trim().length > 0) localStorage.setItem('criptogo_apikey', apiKey); 
      else localStorage.removeItem('criptogo_apikey');
  }, [apiKey]);

  useEffect(() => {
      const getRates = async () => setRates(await fetchExchangeRates());
      getRates();
  }, [refreshTrigger]);

  /**
   * EFECTO DE SCROLL UNIVERSAL
   * Se dispara cuando scrollToSymbol tiene un valor.
   */
  useEffect(() => {
    if (scrollToSymbol) {
        const timer = setTimeout(() => {
            const element = document.getElementById(`asset-card-${scrollToSymbol}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setScrollToSymbol(null);
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [scrollToSymbol]);

  const handleRefreshAll = () => { 
    setLastUpdate(new Date()); 
    setRefreshTrigger(prev => prev + 1); 
  };

  useEffect(() => {
    if (prevView.current === 'overview' && view !== 'overview') {
        wasAutoRefreshEnabledBeforeNav.current = autoRefreshEnabled;
        setAutoRefreshEnabled(false);
    } else if (prevView.current !== 'overview' && view === 'overview') {
        setAutoRefreshEnabled(wasAutoRefreshEnabledBeforeNav.current);
    }
    prevView.current = view;
  }, [view]);

  useEffect(() => {
    if (autoRefreshEnabled && view === 'overview') {
        const interval = window.setInterval(handleRefreshAll, 30000); 
        return () => clearInterval(interval);
    }
  }, [view, autoRefreshEnabled]);

  const visibleAssets = useMemo(() => {
    let list: Asset[] = [];
    if (view === 'dashboard' || view === 'overview') {
        const userStocks = assets.filter(a => a.type === 'STOCK');
        const userCryptos = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
        const topStocks = TOP_STOCKS.filter(t => !userStocks.some(u => u.symbol === t.symbol));
        list = [...userCryptos, ...userStocks, ...topStocks];
    } else {
        if (marketMode === 'CRYPTO') {
            list = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
        } else {
            const userStocks = assets.filter(a => a.type === 'STOCK');
            const topStocks = TOP_STOCKS.filter(t => !userStocks.some(u => u.symbol === t.symbol));
            list = [...userStocks, ...topStocks];
        }
    }

    return list.map(asset => ({
        ...asset,
        isFavorite: favorites.includes(asset.symbol)
    })).sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
    });
  }, [assets, marketMode, favorites, view]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || isAdding) return;
    setIsAdding(true);
    setAddError(null);
    setAiSuggestionData(null); 
    
    let targetSymbol = newSymbol.trim();

    if (['?', '?+', '?++', '?-'].includes(targetSymbol)) {
        if (!apiKey) {
            setAddError("Configura tu API Key para usar la Búsqueda Inteligente.");
            setShowAjustes(true);
            setIsAdding(false);
            return;
        }
        try {
            let cmd: 'BEST' | 'SHORT' | 'MID' | 'RISK' = 'BEST';
            let label = 'Mejor Valor';
            if (targetSymbol === '?+') { cmd = 'SHORT'; label = 'Crecimiento Corto'; }
            else if (targetSymbol === '?++') { cmd = 'MID'; label = 'Crecimiento Medio'; }
            else if (targetSymbol === '?-') { cmd = 'RISK'; label = 'Especulativo'; }
            const suggestion = await getSmartRecommendation(cmd, marketMode, apiKey, visibleAssets.map(a => a.symbol));
            if (!suggestion || !suggestion.symbol) {
                setAddError("La IA no pudo sugerir un activo.");
                setIsAdding(false);
                return;
            }
            targetSymbol = suggestion.symbol; 
            setAiSuggestionData({ symbol: suggestion.symbol, reason: suggestion.reason, label });
        } catch (err) {
            setAddError("Error IA.");
            setIsAdding(false);
            return;
        }
    }

    const foundAsset = await resolveAsset(targetSymbol);
    
    if (foundAsset) {
        const alreadyExists = assets.some(a => a.symbol === foundAsset.symbol && a.type === foundAsset.type);
        const inTopStocks = foundAsset.type === 'STOCK' && TOP_STOCKS.some(t => t.symbol === foundAsset.symbol);

        if (alreadyExists || inTopStocks) { 
            // Si ya existe, simplemente hacemos scroll hacia él
            setScrollToSymbol(foundAsset.symbol);
            setNewSymbol('');
            setAddError(null);
        } else { 
            setAssets(prev => [foundAsset, ...prev]); 
            setNewSymbol(''); 
        }
    } else { 
        setAddError(`No se encontró "${targetSymbol}" en Binance ni Yahoo Finance.`);
    }
    setIsAdding(false);
  };
  
  const handleCommandClick = (cmd: string) => {
      setNewSymbol(cmd);
      setShowSmartCommands(false);
      if (inputRef.current) inputRef.current.focus();
  };

  const handleDelete = (symbol: string) => setAssets(assets.filter(a => a.symbol !== symbol));
  const handleToggleFavorite = (symbol: string) => {
      setFavorites(favorites.includes(symbol) ? favorites.filter(f => f !== symbol) : [...favorites, symbol]);
  };

  const moveAsset = (symbol: string, direction: 'left' | 'right') => {
    const realIndex = assets.findIndex(a => a.symbol === symbol);
    if (realIndex === -1) return; 
    const newAssets = [...assets];
    if (direction === 'left' && realIndex > 0) [newAssets[realIndex - 1], newAssets[realIndex]] = [newAssets[realIndex], newAssets[realIndex - 1]];
    else if (direction === 'right' && realIndex < newAssets.length - 1) [newAssets[realIndex + 1], newAssets[realIndex]] = [newAssets[realIndex], newAssets[realIndex + 1]];
    setAssets(newAssets);
  };

  const navigateToAnalysis = () => { setView('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleWidgetNavigation = (asset: Asset) => {
    setMarketMode(asset.type === 'STOCK' ? 'STOCK' : 'CRYPTO');
    setView('dashboard');
    setScrollToSymbol(asset.symbol);
  };

  return (
    <>
    {!isAuthenticated && <Seguridad onLoginSuccess={() => setIsAuthenticated(true)} />}
    <div className={`min-h-screen ${COLORS.bg} font-sans text-gray-900 p-4 md:p-8 print:bg-white print:p-0 ${!isAuthenticated ? 'blur-sm pointer-events-none' : ''}`}>
      <div className="max-w-7xl mx-auto print:max-w-none">
        
        <header className="sticky top-0 z-50 bg-gray-50 mb-8 border-b border-gray-200 pb-6 pt-4 print:hidden">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-red-700" size={32} />
                    Cripto<span className="text-red-700">GO</span>
                </h1>
                <p className="text-gray-500 mt-1 text-xs uppercase tracking-wide font-medium flex items-center gap-1">
                    <Database size={12} /> {view === 'dashboard' ? 'Visión Integrada DeFi/TradFi' : `Datos Reales Integrados`} • <Sparkles size={12} className="text-indigo-500"/> Gemini AI Inside
                </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                    <input 
                        type="checkbox" 
                        checked={autoRefreshEnabled} 
                        onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-red-700 focus:ring-red-500 cursor-pointer"
                        title="Auto-refresco (30s)"
                    />
                    <span className="text-gray-500">Sincro:</span>
                    <span className="font-mono font-bold text-gray-900">{lastUpdate.toLocaleTimeString()}</span>
                    <div className="h-3 w-px bg-gray-300 mx-1"></div>
                    <button onClick={handleRefreshAll} className="text-gray-500 hover:text-indigo-600 p-1 -my-1 rounded transition-all"><RefreshCw size={14} /></button>
                 </div>

                 <div className="flex gap-3 items-center">
                    <div className="flex bg-gray-100 rounded border border-gray-200 p-0.5 shadow-sm">
                        <button onClick={() => setView('overview')} className={`p-1.5 rounded transition-all flex items-center px-3 ${view === 'overview' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Dashboard"><LayoutGrid size={16} /></button>
                        <button onClick={() => setView('dashboard')} className={`p-1.5 rounded transition-all flex items-center px-3 ${view === 'dashboard' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`} title="Análisis Detallado"><BarChart3 size={16} /></button>
                        <button onClick={() => setView('correlation')} className={`p-1.5 rounded transition-all flex items-center px-3 ${view === 'correlation' ? 'bg-white shadow text-red-600' : 'text-gray-400 hover:text-gray-600'}`} title="Correlación"><Activity size={16} /></button>
                        <button onClick={() => setView('guia')} className={`p-1.5 rounded transition-all flex items-center px-3 ${view === 'guia' ? 'bg-white shadow text-red-700 font-bold' : 'text-gray-400 hover:text-gray-600'}`} title="GuIA"><Sparkles size={16} /></button>
                    </div>

                    <div className="relative">
                        <button onClick={() => setCurrencyOpen(!currencyOpen)} className={`flex items-center gap-1 px-3 py-1.5 rounded border transition-colors ${currencyOpen ? 'bg-gray-200 border-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} text-gray-800`}>{CURRENCIES[currency].symbol}</button>
                        {currencyOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)}></div>
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    {Object.values(CURRENCIES).map((c) => (
                                        <button key={c.code} onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }} className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center justify-between ${currency === c.code ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}><span>{c.name}</span><span className="font-mono">{c.symbol}</span></button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                 </div>
            </div>
          </div>
        </header>

        <div className={view === 'overview' ? 'block' : 'hidden'}>
            <GeneralDashboard userAssets={visibleAssets} currency={currency} rate={rates[currency]} onAddClick={navigateToAnalysis} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onMove={moveAsset} onWidgetClick={handleWidgetNavigation} refreshTrigger={refreshTrigger} />
        </div>
        
        <div className={view === 'dashboard' ? 'block' : 'hidden'}>
          <div className="mb-8 flex flex-col md:flex-row gap-4 print:hidden">
                <div className="w-full md:w-2/5 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[160px] overflow-hidden">
                    <div className="grid grid-cols-2 h-full">
                        <FearGreedWidget />
                        <div className="border-l border-gray-100"><VixWidget /></div>
                    </div>
                </div>

                <div className="w-full md:w-3/5 bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center min-h-[160px]">
                    <form onSubmit={handleAdd} className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                <span>Añadir Activo (Detección Automática)</span>
                                <span className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 px-1" onClick={() => setShowSmartCommands(!showSmartCommands)}><BrainCircuit size={10} /> IA Search</span>
                            </label>
                            
                            <div className={`absolute z-20 bg-indigo-900 text-white p-3 rounded-lg shadow-xl text-xs w-64 -mt-24 ml-10 transition-all ${showSmartCommands ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                <ul className="space-y-1 font-mono text-[10px]">
                                    {['?', '?+', '?++', '?-'].map(cmd => (
                                        <li key={cmd} onClick={() => handleCommandClick(cmd)} className="cursor-pointer hover:bg-indigo-700 p-1 rounded transition-colors flex justify-between items-center">
                                            <span><span className="text-yellow-400 font-bold">{cmd}</span> &nbsp;{cmd === '?' ? 'Mejor Valor' : cmd === '?+' ? 'Crecimiento Corto' : cmd === '?++' ? 'Crecimiento Medio' : 'Especulativo'}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="relative">
                                <input ref={inputRef} type="text" value={newSymbol} onChange={(e) => { setNewSymbol(e.target.value); setAddError(null); setAiSuggestionData(null); }} placeholder="Símbolo (Ej: BTC, AAPL, NVDA, SOL...)" disabled={isAdding} className={`w-full bg-gray-50 border ${addError ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-300'} rounded p-2.5 pl-9 text-sm focus:ring-2 focus:ring-gray-900 outline-none font-medium transition-all`}/>
                                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                        </div>
                        <button type="submit" disabled={isAdding} className={`${COLORS.btnPrimary} p-2.5 rounded w-32 font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50`}>
                            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {isAdding ? 'BUSCANDO' : 'AÑADIR'}
                        </button>
                    </form>
                    {isAdding && !addError && !aiSuggestionData && (
                        <div className="mt-2 bg-gray-50 text-gray-500 px-3 py-2 rounded text-xs flex items-center gap-2 font-medium shadow-sm animate-pulse">
                            <Loader2 size={14} className="animate-spin text-red-700" />
                            Buscando activo...
                        </div>
                    )}
                    {addError && <div className="mt-2 bg-red-50 text-red-700 px-3 py-2 rounded text-xs flex items-center gap-2 font-medium shadow-sm"><AlertCircle size={14} />{addError}</div>}
                    {aiSuggestionData && <div className="mt-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded text-xs flex items-center gap-2 font-medium shadow-sm cursor-pointer" onClick={() => setShowAiReason(true)}><Sparkles size={14} />IA Sugiere: {aiSuggestionData.symbol}</div>}
                </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 items-start">
              {visibleAssets.map((asset, index) => (
                <AssetCard key={`${asset.symbol}-${asset.type}`} asset={asset} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} refreshTrigger={refreshTrigger} onMove={moveAsset} index={index} total={visibleAssets.length} currency={currency} rate={rates[currency]} apiKey={apiKey} onRequireKey={() => setShowAjustes(true)} />
              ))}
          </div>
        </div>

        <div className={view === 'correlation' ? 'block' : 'hidden'}><CryptoCorrelationPro apiKey={apiKey} onRequireKey={() => setShowAjustes(true)} currency={currency} rate={rates[currency]} availableAssets={assets} /></div>
        <div className={view === 'guia' ? 'block' : 'hidden'}><Guia /></div>

        <div className="print:hidden mt-12"><Footer assetCount={visibleAssets.length} userIp={userIp} onManageCookies={() => setShowCookies(true)} onManageApiKey={() => setShowAjustes(true)} hasApiKey={!!apiKey}/></div>
      </div>
    </div>
    
    <Cookies isOpen={showCookies} onClose={() => setShowCookies(false)} />
    <Ajustes isOpen={showAjustes} onClose={() => setShowAjustes(false)} apiKey={apiKey} onApiKeySave={(key) => { setApiKey(key); handleRefreshAll(); }} userIp={userIp} />
    {showAiReason && aiSuggestionData && <AiSuggestionModal symbol={aiSuggestionData.symbol} reason={aiSuggestionData.reason} criteriaLabel={aiSuggestionData.label} onClose={() => setShowAiReason(false)} />}
    </>
  );
}
