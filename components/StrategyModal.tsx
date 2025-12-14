import React from 'react';
import { X, Layers, ShieldCheck, Zap, TrendingDown, Target, MousePointerClick } from 'lucide-react';

interface Props {
  type: 'conservative' | 'aggressive' | 'accumulation';
  onClose: () => void;
}

const StrategyModal: React.FC<Props> = ({ type, onClose }) => {
  
  let config = {
    title: "",
    subtitle: "",
    color: "",
    bg: "",
    icon: Layers,
    desc: "",
    math: "",
    pros: "",
    cons: ""
  };

  switch (type) {
    case 'conservative':
      config = {
        title: "Rango Conservador (Wide)",
        subtitle: "Estrategia de Cobertura Total",
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-100",
        icon: ShieldCheck,
        desc: "Este rango cubre la totalidad del movimiento histórico detectado en el periodo seleccionado, añadiendo un margen de seguridad extra del 5%.",
        math: "Mínimo Histórico (-5%) ↔ Máximo Histórico (+5%)",
        pros: "Mínimo mantenimiento. Muy bajo riesgo de que el precio se salga del rango (Impermanent Loss bajo). Ideal para dejar la posición abierta semanas o meses.",
        cons: "Menor rentabilidad (APR) porque la liquidez está muy dispersa. Se capturan menos comisiones."
      };
      break;
    case 'aggressive':
      config = {
        title: "Rango Agresivo (Narrow)",
        subtitle: "Estrategia de Rendimiento Máximo",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-100",
        icon: Zap,
        desc: "Este rango se centra exclusivamente en la zona de mayor probabilidad estadística actual, ignorando los extremos históricos.",
        math: "Precio Actual ± 1 Desviación Estándar (Volatilidad)",
        pros: "Rentabilidad (APR) explosiva. Al concentrar el capital donde está el precio ahora, capturas muchas más comisiones.",
        cons: "Alto mantenimiento. Si el precio se mueve con fuerza, se saldrá del rango rápidamente, dejando de generar comisiones y aumentando el Impermanent Loss."
      };
      break;
    case 'accumulation':
      config = {
        title: "Rango Compra Coste Mínimo",
        subtitle: "Estrategia DCA / Grid de Entrada",
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
        icon: TrendingDown,
        desc: "Diseñado para entrar en el mercado progresivamente. Solo provee liquidez en la mitad inferior del gráfico histórico.",
        math: "Mínimo Histórico ↔ Media Histórica (MA)",
        pros: "Actúa como órdenes de compra escalonadas (Limit Orders). Si el precio baja, acumulas más activo barato. Si sube, vendes con beneficio hasta la media.",
        cons: "Si el precio entra en euforia (Bull Run) y supera la media, te quedarás fuera (vendido) rápidamente."
      };
      break;
  }

  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center ${config.bg}`}>
          <div className="flex items-center gap-2">
            <Icon className={config.color} size={24} />
            <div>
                <h3 className={`font-black text-lg leading-none ${config.color}`}>{config.title}</h3>
                <p className={`text-xs font-medium mt-1 opacity-80 ${config.color}`}>{config.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-500 transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh] text-sm text-gray-700 space-y-5">
            
            <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Target size={16} className="text-gray-400"/> Objetivo
                </h4>
                <p className="leading-relaxed text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                    {config.desc}
                </p>
            </div>

            <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Layers size={16} className="text-gray-400"/> Fórmula de Cálculo
                </h4>
                <div className="font-mono text-xs bg-gray-900 text-gray-200 p-3 rounded shadow-inner">
                    {config.math}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-green-100 bg-green-50 p-3 rounded">
                    <span className="font-bold text-green-800 text-xs uppercase block mb-1">Ventajas (Pros)</span>
                    <p className="text-xs text-green-900 leading-snug">{config.pros}</p>
                </div>
                <div className="border border-red-100 bg-red-50 p-3 rounded">
                    <span className="font-bold text-red-800 text-xs uppercase block mb-1">Riesgos (Cons)</span>
                    <p className="text-xs text-red-900 leading-snug">{config.cons}</p>
                </div>
            </div>
            
            <div className="text-center pt-2">
                <p className="text-[10px] text-gray-400 italic flex items-center justify-center gap-1">
                    <MousePointerClick size={12}/> Pulsa fuera o en la X para cerrar
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;