
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { Asset, CurrencyCode, TimeRange } from '../types';
import DashboardWidget from './DashboardWidget';
import { TOP_STOCKS } from '../constants';

interface Props {
  userAssets: Asset[];
  currency: CurrencyCode;
  rate: number;
  onAddClick: () => void;
  onDelete: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onMove: (symbol: string, direction: 'left' | 'right') => void;
  onWidgetClick?: (asset: Asset) => void;
  refreshTrigger?: number;
}

const GeneralDashboard: React.FC<Props> = ({ userAssets, currency, rate, onAddClick, onDelete, onToggleFavorite, onMove, onWidgetClick, refreshTrigger = 0 }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(() => {
      const saved = localStorage.getItem('criptogo_dashboard_range');
      return (saved as TimeRange) || '1D';
  });
  
  useEffect(() => {
      localStorage.setItem('criptogo_dashboard_range', selectedRange);
  }, [selectedRange]);

  // Se elimina el intervalo local. Ahora se confía plenamente en el `refreshTrigger` 
  // que viene desde App.tsx cada 30 segundos, asegurando que la cabecera y los 
  // widgets estén siempre sincronizados.

  const allStockSymbols = new Set(userAssets.filter(a => a.type === 'STOCK').map(a => a.symbol));
  const uniqueTopStocks = TOP_STOCKS.filter(s => !allStockSymbols.has(s.symbol));
  const displayAssets = [...userAssets, ...uniqueTopStocks];
  const ranges: TimeRange[] = ['1H', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'MAX'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 rounded-lg text-white">
                <LayoutGrid size={20} />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-900 leading-none">Dashboard General</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium flex items-center gap-1">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                   Actualización en vivo (30s)
                </p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto">
                {ranges.map(range => (
                    <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
                            selectedRange === range 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                    >
                        {range}
                    </button>
                ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
         {displayAssets.map((asset, index) => (
            <DashboardWidget 
                key={`${asset.symbol}-${asset.type}`} 
                asset={asset} 
                currency={currency} 
                rate={rate}
                range={selectedRange}
                refreshTrigger={refreshTrigger}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
                onMove={onMove}
                onClick={onWidgetClick}
                index={index}
                total={displayAssets.length}
            />
         ))}
         <button onClick={onAddClick} className="rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50 flex flex-col items-center justify-center min-h-[140px] cursor-pointer transition-all group gap-3 animate-in fade-in">
             <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 group-hover:scale-110 flex items-center justify-center text-gray-300 group-hover:text-gray-900 transition-all">
                <Plus size={24} />
             </div>
             <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 uppercase tracking-wide">Añadir Valor</span>
         </button>
      </div>
    </div>
  );
};

export default GeneralDashboard;
