import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart3, Clock, Database, Sparkles, RefreshCw, Search, Plus, Loader2, AlertCircle, Coins, Bitcoin, Building2, Activity, Zap, BrainCircuit, Info } from 'lucide-react';
import { Asset, CurrencyCode, AssetType } from './types';
import { COLORS, DEFAULT_ASSETS, TOP_STOCKS, CURRENCIES } from './constants';
import { resolveAsset, fetchExchangeRates } from './services/market';
import { getSmartRecommendation } from './services/gemini';
import AssetCard from './components/AssetCard';
import FearGreedWidget from './components/FearGreedWidget';
import VixWidget from './components/VixWidget';
import { LoginScreen } from './components/LoginScreen';
import Footer from './components/Footer';
import LegalNotice from './components/LegalNotice';
import CookiesModal from './components/CookiesModal';
import ApiKeyModal from './components/ApiKeyModal';
import CryptoCorrelationPro from './components/CryptoCorrelationPro';
import AiSuggestionModal from './components/AiSuggestionModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [showCookies, setShowCookies] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [view, setView] = useState<'dashboard' | 'correlation'>('dashboard');
  
  // -- AUTO LOGIN BY IP --
  useEffect(() => {
    const checkIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
           const data = await res.json();
           setUserIp(data.ip);
           const allowedIps = ['79.112.85.173', '37.223.15.63'];
           if (allowedIps.includes(data.ip)) {
             setIsAuthenticated(true);
           }
        }
      } catch (e) {
        console.error("Auto-login failed:", e);
      }
    };
    checkIp();
  }, []);
  
  // -- STATE MANAGEMENT & PERSISTENCE --
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('criptogo_real_assets');
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

  // Favorites state
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

  // API KEY STATE - Inicialización segura desde memoria
  const [apiKey, setApiKey] = useState<string>(() => {
      const stored = localStorage.getItem('criptogo_apikey');
      // Aseguramos que cargamos una cadena válida si existe
      return (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 });

  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  
  // AI Suggestion State
  const [aiSuggestionData, setAiSuggestionData] = useState<{symbol: string, reason: string, label: string} | null>(null);
  const [showAiReason, setShowAiReason] = useState(false);

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [showSmartCommands, setShowSmartCommands] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // -- PERSISTENCE EFFECTS --
  useEffect(() => { localStorage.setItem('criptogo_real_assets', JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem('criptogo_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('criptogo_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('criptogo_market_mode', marketMode); }, [marketMode]);
  
  // Persist API Key - Lógica bidireccional (Guardar o Borrar)
  useEffect(() => { 
      if (apiKey && apiKey.trim().length > 0) {
          localStorage.setItem('criptogo_apikey', apiKey); 
      } else {
          localStorage.removeItem('criptogo_apikey');
      }
  }, [apiKey]);

  // -- RATES FETCHING --
  useEffect(() => {
      const getRates = async () => {
          const fetchedRates = await fetchExchangeRates();
          setRates(fetchedRates);
      };
      getRates();
  }, [refreshTrigger]);

  // -- CALCULATE VISIBLE ASSETS (Moved Up for AI Exclusions) --
  const visibleAssets = useMemo(() => {
    let list: Asset[] = [];
    if (marketMode === 'CRYPTO') {
        list = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
    } else {
        const userStocks = assets.filter(a => a.type === 'STOCK');
        const uniqueTopStocks = TOP_STOCKS.filter(t => !userStocks.some(u => u.symbol === t.symbol));
        list = [...userStocks, ...uniqueTopStocks];
    }
    return list.map(asset => ({
        ...asset,
        isFavorite: favorites.includes(asset.symbol)
    })).sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
    });
  }, [assets, marketMode, favorites]);

  // -- HANDLERS --
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || isAdding) return;
    setIsAdding(true);
    setAddError(null);
    setAiSuggestionData(null); // Clear previous suggestion
    
    let targetSymbol = newSymbol.trim();
    let isSmartSearch = false;

    // --- SMART SEARCH LOGIC ---
    const smartCommands = ['?', '?+', '?++', '?-'];
    if (smartCommands.includes(targetSymbol)) {
        if (!apiKey) {
            setAddError("Configura tu API Key para usar la Búsqueda Inteligente.");
            setShowApiKeyModal(true);
            setIsAdding(false);
            return;
        }

        isSmartSearch = true;
        try {
            let cmd: 'BEST' | 'SHORT' | 'MID' | 'RISK' = 'BEST';
            let label = 'Mejor Valor';
            
            if (targetSymbol === '?+') { cmd = 'SHORT'; label = 'Crecimiento Corto'; }
            else if (targetSymbol === '?++') { cmd = 'MID'; label = 'Crecimiento Medio'; }
            else if (targetSymbol === '?-') { cmd = 'RISK'; label = 'Especulativo'; }

            // Pass currently visible symbols as exclusions
            const excluded = visibleAssets.map(a => a.symbol);
            const suggestion = await getSmartRecommendation(cmd, marketMode, apiKey, excluded);
            
            if (!suggestion || !suggestion.symbol) {
                setAddError("La IA no pudo sugerir un activo en este momento.");
                setIsAdding(false);
                return;
            }
            
            targetSymbol = suggestion.symbol; // Override input with AI suggestion
            
            // Set the full data for the UI and the Modal
            setAiSuggestionData({
                symbol: suggestion.symbol,
                reason: suggestion.reason,
                label: label
            });

        } catch (err) {
            setAddError("Error consultando a la IA.");
            setIsAdding(false);
            return;
        }
    }

    // STRICT SEARCH: We only search within the current marketMode
    const foundAsset = await resolveAsset(targetSymbol, marketMode);
    
    if (foundAsset) {
        // Since we force the search by type, foundAsset.type will always match marketMode
        
        // 1. Check if already in user custom list (checking exact symbol AND type)
        const isUserAsset = assets.some(a => a.symbol === foundAsset.symbol && (a.type || 'CRYPTO') === marketMode);
        
        // 2. Check if it's a Default Top Stock (Only relevant if we are in STOCK mode)
        const isTopStock = marketMode === 'STOCK' && TOP_STOCKS.some(t => t.symbol === foundAsset.symbol);

        if (isUserAsset) { 
            setAddError(`El activo ${foundAsset.symbol} ya está en tu lista.`);
            setAiSuggestionData(null); // Clear AI msg if duplicates
        } else if (isTopStock) {
            setAddError(`El activo ${foundAsset.symbol} ya está incluido por defecto.`);
            setAiSuggestionData(null);
        } else { 
            // Add new asset
            setAssets(prev => [foundAsset, ...prev]); 
            setNewSymbol(''); 
            if (!isSmartSearch) setAddError(null); 
            // We KEEP aiSuggestionData so the user can see/click why it was added
        }
    } else { 
        // Error message specific to the current panel
        if (marketMode === 'CRYPTO') {
            setAddError(`No encontrado "${targetSymbol}" en Binance (verifica USDT).`);
        } else {
            setAddError(`No encontrado "${targetSymbol}" en Yahoo.`);
        }
        setAiSuggestionData(null);
    }
    setIsAdding(false);
  };
  
  const handleCommandClick = (cmd: string) => {
      setNewSymbol(cmd);
      setShowSmartCommands(false);
      if (inputRef.current) {
          inputRef.current.focus();
      }
  };

  const handleDelete = (symbol: string) => setAssets(assets.filter(a => a.symbol !== symbol));
  const handleRefreshAll = () => { setLastUpdate(new Date()); setRefreshTrigger(prev => prev + 1); };

  const handleSaveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('criptogo_apikey', key);
      alert('API Key guardada correctamente.');
  };

  const handleReset = () => { if(confirm('¿Restaurar lista original?')) setAssets(DEFAULT_ASSETS); };

  const handleToggleFavorite = (symbol: string) => {
      if (favorites.includes(symbol)) {
          setFavorites(favorites.filter(f => f !== symbol));
      } else {
          setFavorites([...favorites, symbol]);
      }
  };
  
  const handleClearMemory = () => {
      if (confirm('¿Estás seguro de que quieres borrar todos los datos guardados?\nEsto eliminará tu lista personalizada, favoritos, API Key y configuración.')) {
          localStorage.clear();
          setAssets(DEFAULT_ASSETS);
          setFavorites([]);
          setCurrency('USD');
          setMarketMode('CRYPTO');
          setApiKey('');
          alert('Memoria vaciada. Se han restaurado los valores por defecto.');
      }
  };

  const handleManageCookies = () => {
    setShowCookies(true);
  };

  const moveAsset = (index: number, direction: 'left' | 'right') => {
    const visibleItem = visibleAssets[index];
    const realIndex = assets.findIndex(a => a.symbol === visibleItem.symbol);
    if (realIndex === -1) return; 

    const newAssets = [...assets];
    if (direction === 'left' && realIndex > 0) { 
         [newAssets[realIndex - 1], newAssets[realIndex]] = [newAssets[realIndex], newAssets[realIndex - 1]];
    } else if (direction === 'right' && realIndex < newAssets.length - 1) {
         [newAssets[realIndex + 1], newAssets[realIndex]] = [newAssets[realIndex], newAssets[realIndex + 1]];
    }
    setAssets(newAssets);
  };

  return (
    <>
    {!isAuthenticated && <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />}
    <div className={`min-h-screen ${COLORS.bg} font-sans text-gray-900 p-4 md:p-8 print:bg-white print:p-0 ${!isAuthenticated ? 'blur-sm pointer-events-none' : ''}`}>
      <div className="max-w-7xl mx-auto print:max-w-none">
        
        {/* CABECERA DE INFORME (SOLO IMPRESIÓN) */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider text-black">Informe Técnico de Situación</h1>
                    <p className="text-sm font-mono text-gray-600 mt-1">MÉTODO CRIPTOGO • ANÁLISIS DE CICLO DE MERCADO</p>
                </div>
                <div className="text-right text-xs font-mono text-gray-500">
                    <p>Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                    <p>Analista: Jesús de Pablos</p>
                </div>
            </div>
        </div>

        <header className="sticky top-0 z-50 bg-gray-50 mb-8 border-b border-gray-200 pb-6 pt-4 print:hidden">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
                    <BarChart3 className="text-red-700" size={32} />
                    Cripto<span className="text-red-700">GO</span>
                </h1>
                <p className="text-gray-500 mt-1 text-xs uppercase tracking-wide font-medium flex items-center gap-1">
                    <Database size={12} /> Datos Reales ({marketMode === 'CRYPTO' ? 'Binance' : 'Yahoo'}) • Multi-Timeframe • <Sparkles size={12} className="text-indigo-500"/> Gemini AI Inside
                </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-2 text-xs bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                    <Clock size={14} className="text-gray-400"/>
                    <span className="text-gray-500">Última sincro:</span>
                    <span className="font-mono font-bold text-gray-900">{lastUpdate.toLocaleTimeString()}</span>
                    
                    <div className="h-3 w-px bg-gray-300 mx-1"></div>
                    
                    <button 
                        onClick={handleRefreshAll} 
                        className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-1 -my-1 rounded transition-all"
                        title="Actualizar precios"
                    >
                        <RefreshCw size={14} />
                    </button>
                 </div>

                 <div className="flex gap-3 items-center">
                    
                    {/* View Switcher: Dashboard vs Correlation */}
                    <div className="flex bg-gray-100 rounded border border-gray-200 p-0.5 shadow-sm">
                        <button 
                            onClick={() => setView('dashboard')}
                            className={`p-1.5 rounded transition-all ${view === 'dashboard' ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Dashboard Principal"
                        >
                            <BarChart3 size={14} />
                        </button>
                        <button 
                            onClick={() => setView('correlation')}
                            className={`p-1.5 rounded transition-all ${view === 'correlation' ? 'bg-white shadow text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Análisis de Correlación"
                        >
                            <Activity size={14} />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-gray-300"></div>

                    {/* MARKET SELECTOR */}
                    <div className="flex bg-gray-100 rounded border border-gray-200 p-0.5 shadow-sm">
                        <button 
                            onClick={() => setMarketMode('CRYPTO')}
                            className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${marketMode === 'CRYPTO' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Bitcoin size={12} /> CRYPTO
                        </button>
                        <button 
                            onClick={() => setMarketMode('STOCK')}
                            className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${marketMode === 'STOCK' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Building2 size={12} /> STOCK
                        </button>
                    </div>

                    <div className="h-4 w-px bg-gray-300"></div>
                    
                    {/* CURRENCY SELECTOR */}
                    <div className="relative">
                        <button 
                            onClick={() => setCurrencyOpen(!currencyOpen)}
                            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border transition-colors ${currencyOpen ? 'bg-gray-200 border-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} text-gray-800`}
                        >
                            <Coins size={12} className="text-gray-500"/> 
                            {CURRENCIES[currency].symbol} {currency}
                        </button>
                        
                        {currencyOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)}></div>
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    {Object.values(CURRENCIES).map((c) => (
                                        <button 
                                            key={c.code}
                                            onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 flex items-center justify-between ${currency === c.code ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                                        >
                                            <span>{c.name}</span>
                                            <span className="font-mono">{c.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                 </div>
            </div>
          </div>
        </header>
        
        {/* DASHBOARD VIEW CONTAINER */}
        <div className={view === 'dashboard' ? 'block' : 'hidden'}>
          <div className="mb-8 flex flex-col md:flex-row gap-4 print:hidden">
                {/* WIDGETS Y FORMULARIO */}
                <div className="w-full md:w-2/5 bg-white rounded-lg shadow-sm border border-gray-200 min-h-[160px] overflow-hidden">
                    {marketMode === 'CRYPTO' ? (
                       <FearGreedWidget />
                    ) : (
                       <VixWidget />
                    )}
                </div>

                <div className="w-full md:w-3/5 bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center min-h-[160px]">
                    <form onSubmit={handleAdd} className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="flex justify-between items-center text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                <span>Añadir {marketMode === 'CRYPTO' ? 'Criptomoneda' : 'Acción / Valor'}</span>
                                <span 
                                    className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 px-1 rounded transition-all select-none" 
                                    onClick={() => setShowSmartCommands(!showSmartCommands)}
                                >
                                    <BrainCircuit size={10} /> Comandos IA
                                </span>
                            </label>
                            
                            {/* SMART COMMANDS LEGEND - INTERACTIVE */}
                            <div className={`absolute z-20 bg-indigo-900 text-white p-3 rounded-lg shadow-xl text-xs w-64 -mt-24 ml-10 transition-all duration-300 ${showSmartCommands ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                                <div className="font-bold border-b border-indigo-700 pb-1 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1"><Sparkles size={10} className="text-yellow-400"/> IA Search Commands</span>
                                    <span className="text-[9px] font-normal text-indigo-300">(Clic para copiar)</span>
                                </div>
                                <ul className="space-y-1 font-mono text-[10px]">
                                    <li onClick={() => handleCommandClick('?')} className="cursor-pointer hover:bg-indigo-700 p-1 rounded transition-colors flex justify-between items-center group">
                                        <span><span className="text-yellow-400 font-bold">?</span> &nbsp;&nbsp;Mejor Valor</span>
                                        <span className="hidden group-hover:inline opacity-50">↵</span>
                                    </li>
                                    <li onClick={() => handleCommandClick('?+')} className="cursor-pointer hover:bg-indigo-700 p-1 rounded transition-colors flex justify-between items-center group">
                                        <span><span className="text-yellow-400 font-bold">?+</span> &nbsp;Crecimiento Corto</span>
                                        <span className="hidden group-hover:inline opacity-50">↵</span>
                                    </li>
                                    <li onClick={() => handleCommandClick('?++')} className="cursor-pointer hover:bg-indigo-700 p-1 rounded transition-colors flex justify-between items-center group">
                                        <span><span className="text-yellow-400 font-bold">?++</span> Crecimiento Medio</span>
                                        <span className="hidden group-hover:inline opacity-50">↵</span>
                                    </li>
                                    <li onClick={() => handleCommandClick('?-')} className="cursor-pointer hover:bg-indigo-700 p-1 rounded transition-colors flex justify-between items-center group">
                                        <span><span className="text-yellow-400 font-bold">?-</span> &nbsp;Especulativo</span>
                                        <span className="hidden group-hover:inline opacity-50">↵</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="relative">
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={newSymbol} 
                                    onChange={(e) => { setNewSymbol(e.target.value); setAddError(null); setAiSuggestionData(null); }} 
                                    placeholder={marketMode === 'CRYPTO' ? "Ej: BTC, ETH... o escribe ?" : "Ej: NVDA, TSLA... o escribe ?"}
                                    disabled={isAdding} 
                                    className={`w-full bg-gray-50 border ${addError ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-300'} rounded p-2.5 pl-9 text-sm focus:ring-2 focus:ring-gray-900 focus:outline-none font-medium transition-all`}
                                />
                                <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                            </div>
                        </div>
                        <button type="submit" disabled={isAdding} className={`${COLORS.btnPrimary} p-2.5 rounded w-32 font-bold text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50`}>
                            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {isAdding ? 'BUSCANDO' : 'AÑADIR'}
                        </button>
                    </form>
                    
                    {/* Error / AI Message Area */}
                    {addError ? (
                        <div className="mt-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded text-xs flex items-center gap-2 animate-in slide-in-from-top-1 font-medium shadow-sm">
                            <AlertCircle size={14} className="flex-shrink-0" />
                            <span>{addError}</span>
                        </div>
                    ) : aiSuggestionData ? (
                        <div 
                            className="mt-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded text-xs flex items-center gap-2 animate-in slide-in-from-top-1 font-medium shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors group"
                            onClick={() => setShowAiReason(true)}
                            title="Haz clic para saber por qué"
                        >
                            <Sparkles size={14} className="flex-shrink-0 text-indigo-500" />
                            <span>IA Sugiere: {aiSuggestionData.symbol} ({aiSuggestionData.label})</span>
                            <Info size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-indigo-400" />
                        </div>
                    ) : (
                        <p className="mt-3 text-[10px] text-gray-400 leading-tight">
                            * {marketMode === 'CRYPTO' ? 'Introduce el Ticker o Nombre (Binance).' : 'Introduce el Ticker de Bolsa (Yahoo Finance).'}
                        </p>
                    )}
                </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 print:grid-cols-2 print:gap-4">
              {visibleAssets.map((asset, index) => {
                  return (
                    <AssetCard 
                        key={asset.symbol} 
                        asset={asset} 
                        onDelete={handleDelete} 
                        onToggleFavorite={handleToggleFavorite}
                        refreshTrigger={refreshTrigger} 
                        onMove={moveAsset} 
                        index={index} 
                        total={visibleAssets.length}
                        currency={currency}
                        rate={rates[currency]}
                        isFixed={false}
                        apiKey={apiKey}
                        onRequireKey={() => setShowApiKeyModal(true)}
                    />
                  );
              })}
          </div>
            
          {visibleAssets.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg print:hidden">
                    <AlertCircle className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="text-gray-500 font-medium">Lista de {marketMode === 'CRYPTO' ? 'Criptos' : 'Acciones'} vacía</p>
                    <button onClick={handleReset} className="text-red-700 font-bold text-sm hover:underline mt-2">Cargar Lista por Defecto</button>
                </div>
          )}
        </div>

        {/* CORRELATION VIEW CONTAINER */}
        <div className={view === 'correlation' ? 'block' : 'hidden'}>
          <CryptoCorrelationPro 
            apiKey={apiKey} 
            onRequireKey={() => setShowApiKeyModal(true)}
            currency={currency}
            rate={rates[currency]}
          />
        </div>

        <div className="print:hidden mt-12">
            <LegalNotice />
            <Footer 
                assetCount={visibleAssets.length} 
                userIp={userIp} 
                onManageCookies={handleManageCookies} 
                onClearMemory={handleClearMemory}
                onManageApiKey={() => setShowApiKeyModal(true)}
                hasApiKey={!!apiKey}
            />
        </div>
      </div>
    </div>
    
    {/* MODALS */}
    <CookiesModal isOpen={showCookies} onClose={() => setShowCookies(false)} />
    <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
        onSave={handleSaveApiKey} 
        existingKey={apiKey}
    />
    {showAiReason && aiSuggestionData && (
        <AiSuggestionModal 
            symbol={aiSuggestionData.symbol}
            reason={aiSuggestionData.reason}
            criteriaLabel={aiSuggestionData.label}
            onClose={() => setShowAiReason(false)}
        />
    )}
    </>
  );
}