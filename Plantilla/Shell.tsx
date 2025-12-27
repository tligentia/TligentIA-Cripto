
import React, { useState } from 'react';
import { BarChart3, Database, Sparkles, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { COLORS } from './Parameters';
// Fixed import for default export
import Footer from './Footer';
import { Cookies } from './Cookies';
import { Ajustes } from './Ajustes';
import { Manual } from './Manual';
import { AppMenu } from './AppMenu';

interface ShellProps {
  children: React.ReactNode;
  apiKey: string;
  onApiKeySave: (key: string) => void;
  userIp: string | null;
  isKeyValid?: boolean | null;
}

export const Shell: React.FC<ShellProps> = ({ children, apiKey, onApiKeySave, userIp, isKeyValid }) => {
  const [showAjustes, setShowAjustes] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showManual, setShowManual] = useState(false);

  return (
    <div className={`min-h-screen ${COLORS.bg} font-sans flex flex-col p-4 md:p-8`}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white mb-8 border-b border-gray-200 pb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 flex items-center gap-2">
            <BarChart3 className="text-red-700" size={32} />
            Hello<span className="text-red-700"> !!</span>
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              {isKeyValid === true ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-md border border-green-100 animate-in fade-in zoom-in">
                  <CheckCircle2 size={10} /> AI ONLINE
                </span>
              ) : isKeyValid === false ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-red-700 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-pulse cursor-help" title="Configuración requerida">
                  <AlertCircle size={10} /> AI OFFLINE
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                  <Sparkles size={10} className="animate-spin" /> SYNCING
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 px-4 py-2 rounded-xl transition-all active:scale-95 group shadow-sm"
          >
            <HelpCircle size={18} className="text-red-700 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Manual</span>
          </button>

          {/* Menu de aplicaciones situado a la derecha del manual */}
          <AppMenu />
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full">{children}</main>

      {/* FOOTER */}
      <Footer 
        assetCount={0}
        userIp={userIp} 
        onManageCookies={() => setShowCookies(true)} 
        onManageApiKey={() => setShowAjustes(true)} 
        hasApiKey={!!apiKey}
      />

      {/* MODAL AJUSTES (API, IPs, RESET) */}
      <Ajustes 
        isOpen={showAjustes} 
        onClose={() => setShowAjustes(false)} 
        apiKey={apiKey}
        onApiKeySave={onApiKeySave}
        userIp={userIp}
      />

      {/* MODAL PRIVACIDAD Y COOKIES */}
      <Cookies isOpen={showCookies} onClose={() => setShowCookies(false)} />

      {/* MODAL MANUAL DE AYUDA */}
      <Manual isOpen={showManual} onClose={() => setShowManual(false)} />
    </div>
  );
};
