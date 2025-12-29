import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowUp, ArrowDown, Loader2, Star, Trash2, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { Asset, CurrencyCode, TimeRange } from '../types';
import { fetchHistoricalSeries } from '../services/market';
import { CURRENCIES, TOP_STOCKS } from '../constants';

interface Props {
  asset: Asset;
  currency: CurrencyCode;
  rate: number;
  range: TimeRange;
  refreshTrigger?: number;
  index: number;
  total: number;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  onClick?: (asset: Asset) => void;
}

const DashboardWidget: React.FC<Props> = ({ asset, currency, rate, range, refreshTrigger = 0, index, total, onDelete, onToggleFavorite, onMove, onClick }) => {
  const [data, setData] = useState<{ price: number, change: number, diff: number, history: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const isTopStock = TOP_STOCKS.some(s => s.symbol === asset.symbol);

  useEffect(() => {
    isMounted.current = true;
    const load = async () => {
      // Evitar parpadeos innecesarios si ya tenemos datos y solo es un refresco automático
      if (!data) setLoading(true);
      
      try {
        const type = asset.type === 'STOCK' ? 'STOCK' : 'CRYPTO';
        const history = await fetchHistoricalSeries(asset.symbol, type, range);
        
        if (isMounted.current && history.length > 0) {
          const start = history[0].close;
          const current = history[history.length - 1].close;
          setData({
            price: current,
            change: ((current - start) / start) * 100,
            diff: current - start,
            history: history.map(h => ({ value: h.close }))
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    // Pequeño delay escalonado basado en el índice para no saturar el navegador en la carga inicial
    const timeout = setTimeout(load, index * 50);
    return () => { 
        isMounted.current = false;
        clearTimeout(timeout);
    };
  }, [asset.symbol, range, refreshTrigger]);

  const curConf = CURRENCIES[currency];
  const digits = curConf.isCrypto ? 6 : (currency === 'JPY' ? 0 : 2);
  const isPositive = data ? data.change >= 0 : true;
  const color = isPositive ? '#10b981' : '#ef4444';

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 h-32 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start">
            <div className="w-16 h-4 bg-gray-100 rounded"></div>
            <div className="w-12 h-4 bg-gray-50 rounded"></div>
        </div>
        <div className="w-24 h-6 bg-gray-100 rounded mt-2"></div>
        <div className="w-full h-8 bg-gray-50 rounded mt-2"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div 
      onClick={() => onClick?.(asset)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group cursor-pointer animate-in fade-in"
    >
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-start gap-1">
          <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(asset.symbol); }}
                className={`pt-0.5 transition-colors ${asset.isFavorite ? 'text-amber-400' : 'text-gray-200'}`}
          >
             <Star size={12} fill={asset.isFavorite ? "currentColor" : "none"} />
          </button>
          <div>
            <h3 className="font-black text-gray-900 text-sm tracking-tight leading-none">{asset.symbol}</h3>
            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[80px] mt-0.5">{asset.name}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
           {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
           {Math.abs(data.change).toFixed(2)} %
        </div>
      </div>

      <div className="flex flex-col items-start relative z-10 mt-2">
         <span className="text-xl font-bold text-gray-900 font-mono tracking-tighter leading-none">
            {curConf.symbol} {(data.price * rate).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
         </span>
         <span className={`text-[10px] font-mono font-bold mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : '-'}{(Math.abs(data.diff) * rate).toLocaleString('es-ES', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
         </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-40 transition-opacity z-0 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.history}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-gray-100">
          <div className="flex bg-gray-100 rounded p-0.5 border border-gray-200">
             <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'left'); }} disabled={index === 0} className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-600">
                 <ChevronLeft size={10} />
             </button>
             <button onClick={(e) => { e.stopPropagation(); onMove(asset.symbol, 'right'); }} disabled={index === total - 1} className="p-1 hover:bg-white rounded disabled:opacity-30 text-gray-600">
                 <ChevronRight size={10} />
             </button>
          </div>
          {isTopStock ? <div className="p-1.5 text-gray-300"><Lock size={10} /></div> : 
            <button onClick={(e) => { e.stopPropagation(); onDelete(asset.symbol); }} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded">
                <Trash2 size={10} />
            </button>
          }
      </div>
    </div>
  );
};

export default DashboardWidget;