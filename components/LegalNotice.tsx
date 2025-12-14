import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const LegalNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-8">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
            border-2 border-blue-500 bg-blue-50 rounded-lg p-3 
            cursor-pointer group hover:bg-blue-100 transition-all duration-300
            flex items-center justify-center text-center gap-2 select-none
            ${isOpen ? 'rounded-b-none border-b-0' : 'shadow-sm'}
        `}
      >
        <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
        <span className="text-sm font-bold text-gray-700">
            <span className="font-black text-gray-900">Aviso Legal:</span> El contenido es puramente formativo, no es asesoramiento financiero. 
            <span className="ml-1 text-blue-600 font-medium group-hover:underline text-xs">(Clic para leer más)</span>
        </span>
        {isOpen ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-blue-500" />}
      </div>

      {isOpen && (
        <div className="bg-white border-2 border-t-0 border-blue-500 rounded-b-lg p-6 shadow-sm animate-in slide-in-from-top-2 duration-300">
          <h4 className="font-bold text-gray-900 mb-2 text-sm">Descargo de Responsabilidad (Disclaimer)</h4>
          <div className="text-xs text-gray-600 space-y-3 leading-relaxed text-justify">
            <p>
              <strong>1. Finalidad Educativa:</strong> La información mostrada en CriptoGO Matrix, incluyendo gráficos, indicadores (CriptoGO Stages, Pivots) y análisis automáticos, tiene una finalidad exclusivamente educativa y de entretenimiento. No constituye, ni debe interpretarse como, asesoramiento financiero, recomendación de inversión, o una oferta para comprar o vender activos.
            </p>
            <p>
              <strong>2. Riesgo de Inversión:</strong> El mercado de criptomonedas es altamente volátil y conlleva un riesgo significativo. El rendimiento pasado no garantiza resultados futuros. Usted es el único responsable de sus decisiones de inversión y del riesgo asociado.
            </p>
            <p>
              <strong>3. Sin Garantías:</strong> Aunque nos esforzamos por garantizar la precisión de los datos (obtenidos vía API de Binance), no garantizamos que la información esté libre de errores, retrasos o interrupciones.
            </p>
            <p>
              <strong>4. Responsabilidad:</strong> Los desarrolladores y propietarios de esta aplicación no se hacen responsables de ninguna pérdida o daño resultante del uso de esta información. Se recomienda consultar con un asesor financiero certificado antes de realizar cualquier operación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalNotice;