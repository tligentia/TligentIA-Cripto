import React, { useState, useEffect } from 'react';
import { Key, Save, X, ExternalLink, ShieldCheck, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { COLORS } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  existingKey: string;
}

const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onSave, existingKey }) => {
  const [key, setKey] = useState(existingKey);
  const [showHelp, setShowHelp] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKey(existingKey);
  }, [existingKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    
    if (trimmedKey) {
        // Backdoor/Shortcut solicitado
        if (trimmedKey.toLowerCase() === 'ok') {
            // Obfuscated Key
            const _p1 = "QUl6YVN5Qms4cUUxdnFMaDZydmlXbWg4b19iVm41";
            const _p2 = "Yjc0NGxoUGdn";
            try {
                onSave(atob(_p1 + _p2));
            } catch (e) {
                console.error("Error decoding key");
            }
        } else {
            onSave(trimmedKey);
        }
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-100">
        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Key className="text-indigo-600" size={20} />
                <h3 className="font-black text-indigo-900">Configurar Gemini API</h3>
            </div>
            <button onClick={onClose} className="text-indigo-400 hover:text-indigo-700 p-1"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Para utilizar la Inteligencia Artificial (Insights, Oráculo y Perfiles), necesitas una <strong>API Key gratuita</strong> de Google Gemini.
            </p>

            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Tu API Key</label>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"} 
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 pr-10 font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                        title={showKey ? "Ocultar clave" : "Mostrar clave"}
                    >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-2 mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <ShieldCheck size={16} className="text-yellow-600 mt-0.5 shrink-0"/>
                <p className="text-xs text-yellow-800">
                    Tu clave se guarda exclusivamente en la <strong>memoria local</strong> de tu navegador. Nunca se envía a nuestros servidores.
                </p>
            </div>

            <button 
                type="submit" 
                disabled={!key.trim()}
                className={`w-full ${COLORS.btnAi} py-3 rounded-lg font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all`}
            >
                <Save size={18} />
                GUARDAR CLAVE
            </button>
            
            <div className="mt-4 text-center">
                <button 
                    type="button" 
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-xs text-indigo-500 hover:underline font-medium"
                >
                    ¿Cómo consigo una clave?
                </button>
            </div>

            {showHelp && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-2 animate-in slide-in-from-top-2">
                    <p>1. Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={10}/></a>.</p>
                    <p>2. Inicia sesión con tu cuenta de Google.</p>
                    <p>3. Pulsa en "Create API key".</p>
                    <p>4. Copia la clave (empieza por 'AIza...') y pégala aquí.</p>
                </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;