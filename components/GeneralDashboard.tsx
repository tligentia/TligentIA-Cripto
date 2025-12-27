
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Plus, RefreshCw } from 'lucide-react';
import { Asset, CurrencyCode, TimeRange } from '../types';
import DashboardWidget from './DashboardWidget';

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
  lastUpdate?: Date;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  onManualRefresh?: () => void;
}

const GeneralDashboard: React.FC<Props> = ({ 
  userAssets, 
  currency, 
  rate, 
  onAddClick, 
  onDelete, 
  onToggleFavorite, 
  onMove, 
  onWidgetClick, 
  refreshTrigger = 0,
  lastUpdate,
  autoRefresh,
  onToggleAutoRefresh,
  onManualRefresh
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(() => {
      const saved = localStorage.getItem('criptogo_dashboard_range');
      return (saved as TimeRange) || '1D';
  });
  
  useEffect(() => {
      localStorage.setItem('criptogo_dashboard_range', selectedRange);
  }, [selectedRange]);

  const displayAssets = userAssets;
  const ranges: TimeRange[] = ['1H', '1D', '1W', '1M', '3M', 'YTD', '1Y', 'MAX'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
         <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-lg">
                <LayoutGrid size={24} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Dashboard General</h2>
                
                {/* Cronómetro y Controles Compactos (Debajo del Título) */}
                {lastUpdate && (
                  <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            {autoRefresh && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        </span>
                        {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>

                    <div className="flex items-center gap-3">
                      {/* Checkbox Estilizado para Auto (Color Verde Emerald) */}
                      <label className="flex items-center gap-2 cursor-pointer group select-none">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={autoRefresh} 
                            onChange={onToggleAutoRefresh}
                            className="sr-only" 
                          />
                          <div className={`w-3.5 h-3.5 border-2 rounded-sm transition-all flex items-center justify-center ${autoRefresh ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-gray-300 group-hover:border-gray-900'}`}>
                            {autoRefresh && <div className="w-1.5 h-1.5 bg-white rounded-[1px]"></div>}
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${autoRefresh ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-700'}`}>
                          Auto
                        </span>
                      </label>

                      <div className="w-px h-3 bg-gray-200"></div>

                      {/* Botón Refresco Manual */}
                      <button 
                          onClick={onManualRefresh}
                          className="p-1 text-gray-400 hover:text-red-700 transition-all active:rotate-180 flex items-center justify-center"
                          title="Refrescar datos ahora"
                      >
                          <RefreshCw size={12} className={autoRefresh ? 'animate-spin-slow' : ''} />
                      </button>
                    </div>
                  </div>
                )}
            </div>
         </div>
         <div className="flex items-center gap-4 pt-1">
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto shadow-inner border border-gray-200/50">
                {ranges.map(range => (
                    <button
                        key={range}
                        onClick={() => setSelectedRange(range)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            selectedRange === range 
                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' 
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
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
      <style>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GeneralDashboard;
