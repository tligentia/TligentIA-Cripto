import React from 'react';
import { X, Users } from 'lucide-react';

interface Props {
  symbol: string;
  analysis: string;
  onClose: () => void;
}

const ProfilesModal: React.FC<Props> = ({ symbol, analysis, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="text-slate-700" size={24} />
            <div><h3 className="font-black text-slate-900 text-lg leading-none">ESTRATEGIA 3 PERFILES</h3><p className="text-xs text-slate-500 font-medium mt-1">{symbol}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500"><X size={24} /></button>
        </div>
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh]">
           <div className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-relaxed">{analysis}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfilesModal;