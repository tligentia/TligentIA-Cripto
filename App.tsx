import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Asset, CurrencyCode, AssetType } from './types';
import { COLORS, FALLBACK_CRYPTOS, FALLBACK_STOCKS, CURRENCIES, getAllowedIps, validateKey, fetchRemoteAssets } from './Plantilla/Parameters';
import { resolveAsset, fetchExchangeRates } from './services/market';
import { getSmartRecommendation } from './services/gemini';
import AssetCard from './components/AssetCard';
import FearGreedWidget from './components/FearGreedWidget';
import VixWidget from './components/VixWidget';
import { Security } from './Plantilla/Seguridad';
import { Shell } from './Plantilla/Shell';
import CryptoCorrelationPro from './components/CryptoCorrelationPro';
import AiSuggestionModal from './components/AiSuggestionModal';
import GeneralDashboard from './components/GeneralDashboard';
import { Guia } from './components/Guia';
import { Loader2, Search, Plus, BrainCircuit, Sparkles, AlertCircle, LayoutGrid } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('app_is_auth_v2') === 'true');
  const [userIp, setUserIp] = useState<string | null>(null);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  
  const [view, setView] = useState<'overview' | 'dashboard' | 'correlation' | 'guia'>('overview');
  const [scrollToSymbol, setScrollToSymbol] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [apiKey, setApiKey] = useState<string>(() => {
      const stored = localStorage.getItem('app_apikey');
      return (stored && stored !== 'undefined' && stored !== 'null') ? stored : '';
  });

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('criptogo_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  const [marketMode, setMarketMode] = useState<AssetType>(() => {
    const saved = localStorage.getItem('criptogo_market_mode');
    return (saved as AssetType) || 'CRYPTO';
  });

  // Lista única maestra de activos
  const [assets, setAssets] = useState<Asset[]>([]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('criptogo_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [rates, setRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 0.92, JPY: 150, BTC: 0.000015, ETH: 0.00035 });
  const [newSymbol, setNewSymbol] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [aiSuggestionData, setAiSuggestionData] = useState<{symbol: string, reason: string, label: string} | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- SINCRONIZACIÓN INICIAL POR TICKER (CRIPTO + BOLSA) ---
  useEffect(() => {
    const initializePortfolio = async () => {
      // 1. Obtener activos de la nube identificados por Ticker
      const remote = await fetchRemoteAssets();
      
      // 2. Cargar activos memorizados localmente
      const saved = localStorage.getItem('criptogo_real_assets');
      const localAssets: Asset[] = saved ? JSON.parse(saved) : [];

      let merged: Asset[] = [];

      if (localAssets.length > 0) {
        // Base: Lo que el usuario ya tiene en su navegador
        merged = [...localAssets];
        
        // Inyección de Novedades del Sheet (Cripto y Bolsa)
        if (remote.success) {
           remote.all.forEach(remoteItem => {
              // Si el Ticker no existe en local, se añade al final
              if (!merged.some(a => a.symbol === remoteItem.symbol)) {
                  merged.push(remoteItem);
              }
           });
        }
      } else if (remote.success) {
        // Si el navegador está limpio, cargar todo lo del Sheet
        merged = remote.all;
      } else {
        // Fallback si no hay red ni datos previos
        merged = [...FALLBACK_CRYPTOS, ...FALLBACK_STOCKS];
      }

      setAssets(merged);
      setIsInitialLoading(false);
    };

    initializePortfolio();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      setLastUpdate(new Date());
    }, 60000); 
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        if (getAllowedIps().includes(data.ip)) {
          handleLoginSuccess();
        }
      })
      .catch(e => console.error("IP checking error", e));
  }, []);

  useEffect(() => {
    const check = async () => {
      if (!apiKey) {
        setIsKeyValid(false);
        return;
      }
      const valid = await validateKey(apiKey);
      setIsKeyValid(valid);
    };
    check();
  }, [apiKey]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('app_is_auth_v2', 'true');
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('app_apikey', key);
    handleManualRefresh();
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date());
  };

  useEffect(() => { 
    if (!isInitialLoading) {
      localStorage.setItem('criptogo_real_assets', JSON.stringify(assets)); 
    }
  }, [assets, isInitialLoading]);

  useEffect(() => { localStorage.setItem('criptogo_favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('criptogo_currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('criptogo_market_mode', marketMode); }, [marketMode]);

  useEffect(() => {
      const getRates = async () => setRates(await fetchExchangeRates());
      getRates();
  }, [refreshTrigger]);

  const visibleAssets = useMemo(() => {
    let list: Asset[] = [];
    if (view === 'dashboard' || view === 'overview') {
        // Dashboard unificado: muestra todo lo sincronizado
        list = [...assets];
    } else {
        // Vistas filtradas por tipo
        if (marketMode === 'CRYPTO') {
            list = assets.filter(a => (a.type || 'CRYPTO') === 'CRYPTO');
        } else {
            list = assets.filter(a => a.type === 'STOCK');
        }
    }
    // Ordenar favoritos primero
    return list.map(asset => ({ ...asset, isFavorite: favorites.includes(asset.symbol) }))
               .sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
  }, [assets, marketMode, favorites, view]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || isAdding) return;
    setIsAdding(true);
    setAddError(null);
    
    let targetSymbol = newSymbol.trim();
    if (['?', '?+', '?++', '?-'].includes(targetSymbol)) {
        if (!isKeyValid) {
            setAddError("API Key requerida.");
            setIsAdding(false);
            return;
        }
        try {
            let cmd: 'BEST' | 'SHORT' | 'MID' | 'RISK' = 'BEST';
            let label = 'Selección Élite';
            if (targetSymbol === '?+') { cmd = 'SHORT'; label = 'Momentum'; }
            else if (targetSymbol === '?++') { cmd = 'MID'; label = 'Trend'; }
            else if (targetSymbol === '?-') { cmd = 'RISK'; label = 'Volatilidad'; }
            const suggestion = await getSmartRecommendation(cmd, marketMode, apiKey, visibleAssets.map(a => a.symbol));
            if (!suggestion) throw new Error();
            targetSymbol = suggestion.symbol;
            setAiSuggestionData({ ...suggestion, label });
        } catch {
            setAddError("Error de IA.");
            setIsAdding(false);
            return;
        }
    }

    const foundAsset = await resolveAsset(targetSymbol);
    if (foundAsset) {
        if (assets.some(a => a.symbol === foundAsset.symbol)) {
            setScrollToSymbol(foundAsset.symbol);
            setNewSymbol('');
        } else {
            setAssets(prev => [foundAsset, ...prev]);
            setNewSymbol('');
        }
    } else {
        setAddError(`No identificado.`);
    }
    setIsAdding(false);
  };

  const handleWidgetNavigation = (asset: Asset) => {
    setMarketMode(asset.type === 'STOCK' ? 'STOCK' : 'CRYPTO');
    setView('dashboard');
    setScrollToSymbol(asset.symbol);
  };

  if (!isAuthenticated) return <Security onLogin={handleLoginSuccess} />;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-red-700 mb-6" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Sincronizando Tickers de Bolsa y Cripto...</p>
      </div>
    );
  }

  return (
    <Shell 
      apiKey={apiKey} 
      onApiKeySave={handleApiKeySave} 
      userIp={userIp} 
      isKeyValid={isKeyValid}
    >
      <div className="space-y-8 pb-20">
        
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit mx-auto shadow-inner border border-gray-200/50">
            {[
                { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
                { id: 'dashboard', label: 'Análisis', icon: BrainCircuit },
                { id: 'correlation', label: 'Quants', icon: Sparkles },
                { id: 'guia', label: 'Recursos', icon: BrainCircuit }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${view === tab.id ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
            ))}
        </div>

        {view === 'overview' && (
            <GeneralDashboard 
                userAssets={visibleAssets} 
                currency={currency} 
                rate={rates[currency]} 
                onAddClick={() => setView('dashboard')}
                onDelete={(s) => setAssets(assets.filter(a => a.symbol !== s))}
                onToggleFavorite={(s) => setFavorites(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s])}
                onMove={(s, d) => {
                    const idx = assets.findIndex(a => a.symbol === s);
                    if (idx === -1) return;
                    const newArr = [...assets];
                    const target = d === 'left' ? idx - 1 : idx + 1;
                    if (target >= 0 && target < newArr.length) {
                        [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
                        setAssets(newArr);
                    }
                }}
                onWidgetClick={handleWidgetNavigation}
                refreshTrigger={refreshTrigger}
                lastUpdate={lastUpdate}
                autoRefresh={autoRefresh}
                onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
                onManualRefresh={handleManualRefresh}
            />
        )}

        {view === 'dashboard' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-[180px]">
                        <div className="grid grid-cols-2 h-full divide-x divide-gray-50">
                            <FearGreedWidget />
                            <VixWidget />
                        </div>
                    </div>
                    <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center min-h-[180px]">
                        <form onSubmit={handleAdd} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Buscador / Smart Sync</label>
                                <div className="relative">
                                    <input 
                                        ref={inputRef}
                                        type="text" 
                                        value={newSymbol} 
                                        onChange={(e) => setNewSymbol(e.target.value)}
                                        placeholder="Ticker (BTC, NVDA...)"
                                        className="w-full bg-gray-50 border border-gray-200 p-3.5 pl-11 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-700/20 outline-none transition-all"
                                    />
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                </div>
                            </div>
                            <button type="submit" disabled={isAdding} className="bg-gray-900 hover:bg-black text-white px-8 h-[52px] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                            </button>
                        </form>
                        {addError && <div className="mt-3 text-red-600 text-[10px] font-black uppercase flex items-center gap-1"><AlertCircle size={12} /> {addError}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleAssets.map((asset, index) => (
                        <AssetCard 
                            key={`${asset.symbol}-${asset.type}`}
                            asset={asset}
                            index={index}
                            total={visibleAssets.length}
                            refreshTrigger={refreshTrigger}
                            currency={currency}
                            rate={rates[currency]}
                            apiKey={apiKey}
                            onDelete={(s) => setAssets(assets.filter(a => a.symbol !== s))}
                            onToggleFavorite={(s) => setFavorites(f => f.includes(s) ? f.filter(x => x !== s) : [...f, s])}
                            onMove={(s, d) => {
                                const idx = assets.findIndex(a => a.symbol === s);
                                if (idx !== -1) {
                                    const newArr = [...assets];
                                    const target = d === 'left' ? idx - 1 : idx + 1;
                                    if (target >= 0 && target < newArr.length) {
                                        [newArr[idx], newArr[target]] = [newArr[target], newArr[idx]];
                                        setAssets(newArr);
                                    }
                                }
                            }}
                            onRequireKey={() => {}} 
                        />
                    ))}
                </div>
            </div>
        )}

        {view === 'correlation' && (
            <CryptoCorrelationPro 
              apiKey={apiKey} 
              onRequireKey={() => {}} 
              currency={currency} 
              rate={rates[currency]} 
              availableAssets={assets} 
            />
        )}

        {view === 'guia' && <Guia />}
      </div>
      
      {aiSuggestionData && (
          <AiSuggestionModal 
            symbol={aiSuggestionData.symbol} 
            reason={aiSuggestionData.reason} 
            criteriaLabel={aiSuggestionData.label} 
            onClose={() => setAiSuggestionData(null)} 
          />
      )}
    </Shell>
  );
}