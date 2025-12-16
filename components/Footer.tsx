import React from 'react';
import { Trash2, Key } from 'lucide-react';

interface FooterProps {
    assetCount: number;
    userIp: string | null;
    onManageCookies: () => void;
    onClearMemory: () => void;
    onManageApiKey: () => void;
    hasApiKey: boolean;
}

const Footer: React.FC<FooterProps> = ({ assetCount, userIp, onManageCookies, onClearMemory, onManageApiKey, hasApiKey }) => {
    return (
        <footer className="w-full mt-12 py-4 border-t border-gray-200 text-gray-500 text-xs bg-white">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                
                {/* Izquierda: Info Técnica */}
                <div className="flex items-center gap-3">
                    <span className="font-bold text-red-700">v25.12S</span>
                    {userIp && <span className="font-mono text-gray-400 hidden sm:inline">{userIp}</span>}
                </div>

                {/* Derecha: Acciones y Créditos */}
                <div className="flex items-center gap-4">
                    <button 
                        type="button" 
                        onClick={onManageApiKey} 
                        className={`hover:underline transition flex items-center gap-1 ${hasApiKey ? 'text-indigo-600 font-bold' : 'hover:text-indigo-600'}`}
                        title={hasApiKey ? "API Key Activa" : "Configurar API Key"}
                    >
                        <Key size={11} /> API Key {hasApiKey && '✓'}
                    </button>

                    <button type="button" onClick={onManageCookies} className="hover:text-gray-900 hover:underline transition">
                        Cookies
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={onClearMemory} 
                        className="hover:text-red-600 hover:underline transition flex items-center gap-1"
                        title="Borrar datos y restaurar"
                    >
                        <Trash2 size={11} /> Reset
                    </button>

                    <span className="text-gray-300">|</span>
                    
                    <div className="flex gap-1">
                        <a href="https://jesus.depablos.es" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition">Jesus de Pablos</a>
                        <span className="text-gray-400">/</span>
                        <a href="https://www.tligent.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition">Tligent</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;