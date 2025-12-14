import React from 'react';
import { X, ShieldCheck, Cookie, Activity, Lock } from 'lucide-react';
import { COLORS } from '../constants';

interface CookiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiesModal: React.FC<CookiesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h3 className="font-bold text-gray-900">Cookies y Privacidad</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Este sitio utiliza cookies y tecnologías similares para mejorar la experiencia del usuario y analizar el tráfico de forma anónima.
          </p>

          <div className="space-y-4">
            {/* Item 1 */}
            <div className="flex gap-3">
              <div className="bg-blue-50 p-2 rounded-lg h-fit">
                <Lock size={18} className="text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Cookies Esenciales</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Necesarias para el funcionamiento básico del sitio (como guardar su lista de favoritos localmente). No se pueden desactivar.
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex gap-3">
              <div className="bg-purple-50 p-2 rounded-lg h-fit">
                <Activity size={18} className="text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Cookies de Rendimiento</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Nos ayudan a entender cómo los visitantes interactúan con el sitio web para mejorar nuestros servicios.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
             <p className="text-xs text-gray-500 text-center">
               No recopilamos información personal identificable (PII) sin su consentimiento explícito.
             </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0">
          <button 
            onClick={onClose}
            className={`w-full ${COLORS.btnPrimary} py-3 rounded-xl font-bold text-sm shadow-lg shadow-gray-200 transition-transform active:scale-95`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiesModal;