import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Asset, CurrencyCode, AssetType, CurrencyConfig } from './types';
import { COLORS, DEFAULT_ASSETS, TOP_STOCKS, CURRENCIES, getAllowedIps, validateKey } from './Plantilla/Parameters';
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

  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = localStorage.getItem('criptogo_real_assets');
    return saved ? JSON.parse(saved) : DEFAULT_ASSETS;
  });

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

  // Auto-refresh logic (Set to 60 seconds as requested)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      setLastUpdate(new Date());
    }, 60000); 
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // IP Fetching
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        setUserIp(data.ip);
        if (getAllowedIps().includes(data.ip)) {
          handleLoginSuccess();
        }
      })
      .catch(e => console.error("IP check failed", e));
  }, []);

  // Validation of Key
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

  useEffect(() => { localStorage.setItem('criptogo_real_assets', JSON.stringify(assets)); }, [assets]);
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
            setAddError("Configura una API Key válida en Ajustes.");
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
            if (!suggestion) throw new Error();
            targetSymbol = suggestion.symbol;
            setAiSuggestionData({ ...suggestion, label });
        } catch {
            setAddError("Error en la Búsqueda Inteligente.");
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
        setAddError(`No se encontró "${targetSymbol}".`);
    }
    setIsAdding(false);
  };

  const handleWidgetNavigation = (asset: Asset) => {
    setMarketMode(asset.type === 'STOCK' ? 'STOCK' : 'CRYPTO');
    setView('dashboard');
    setScrollToSymbol(asset.symbol);
  };

  if (!isAuthenticated) return <Security onLogin={handleLoginSuccess} />;

  return (
    <Shell 
      apiKey={apiKey} 
      onApiKeySave={handleApiKeySave} 
      userIp={userIp} 
      isKeyValid={isKeyValid}
    >
      <div className="space-y-8 pb-20">
        
        {/* Navegación de Vistas */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit mx-auto shadow-inner border border-gray-200/50">
            {[
                { id: 'overview', label: 'Resumen', icon: LayoutGrid },
                { id: 'dashboard', label: 'Análisis', icon: BrainCircuit },
                { id: 'correlation', label: 'Correlación', icon: Sparkles },
                { id: 'guia', label: 'Guía DeFi', icon: BrainCircuit }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setView(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${view === tab.id ? 'bg-white text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
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
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Añadir Activo / IA Smart Search</label>
                                <div className="relative">
                                    <input 
                                        ref={inputRef}
                                        type="text" 
                                        value={newSymbol} 
                                        onChange={(e) => setNewSymbol(e.target.value)}
                                        placeholder="Símbolo (BTC, NVDA...) o '?' para IA"
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