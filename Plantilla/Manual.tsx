import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ShieldCheck, Cpu, Zap, Database, ChevronRight, Menu, Layout, 
  Lock, BarChart3, Activity, Layers, Sparkles, BookOpen, Globe, 
  TrendingUp, Search, MousePointer2, Target, Info, CheckCircle2, 
  TrendingDown, Minus, LayoutGrid, BrainCircuit, Lightbulb, Scale,
  LineChart, AlertTriangle, ArrowUpRight, Gauge
} from 'lucide-react';
import { APP_VERSION } from './Version';

interface ManualProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'man-philosophy', title: 'Visión y Filosofía', icon: <Lightbulb size={16} /> },
  { id: 'man-algorithm', title: 'Núcleo Algorítmico', icon: <Activity size={16} /> },
  { id: 'man-gemini', title: 'Motor de Inteligencia', icon: <Cpu size={16} /> },
  { id: 'man-correlation', title: 'Análisis Cuantitativo', icon: <Layers size={16} /> },
  { id: 'man-lp', title: 'Estrategias de Liquidez', icon: <Gauge size={16} /> },
  { id: 'man-ux', title: 'Guía de Interfaz', icon: <MousePointer2 size={16} /> },
  { id: 'man-security', title: 'Arquitectura Privada', icon: <ShieldCheck size={16} /> }
];

export const Manual: React.FC<ManualProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const threshold = 150;

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) {
        const offsetTop = element.offsetTop - threshold;
        if (scrollTop >= offsetTop) setActiveSection(section.id);
      }
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (isOpen && container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen, handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: element.offsetTop - 20, behavior: 'smooth' });
      setActiveSection(id);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-[94vh] md:max-w-7xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:hidden hover:bg-gray-100 rounded-xl text-gray-900 transition-colors">
              <Menu size={24} />
            </button>
            <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-xl shadow-black/10">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-2xl leading-none">Manual Maestro</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1 hidden sm:block">Protocolo Operativo • Edición {APP_VERSION}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-700 transition-all active:scale-90">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          
          <aside className={`absolute md:relative z-20 w-80 h-full bg-gray-50/30 border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-8 space-y-2 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 px-4">Índice Técnico</p>
              {SECTIONS.map((section) => (
                <button 
                  key={section.id} 
                  onClick={() => scrollToSection(section.id)} 
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeSection === section.id ? 'bg-white text-red-700 border-l-4 border-red-700 shadow-lg ring-1 ring-black/5' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={activeSection === section.id ? 'text-red-700' : 'text-gray-400 group-hover:text-red-700 transition-colors'}>{section.icon}</span>
                    <span className={`text-[11px] font-black uppercase tracking-tight transition-all ${activeSection === section.id ? 'translate-x-1' : ''}`}>{section.title}</span>
                  </div>
                  {activeSection === section.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
            <div className="mt-auto p-8 bg-white border-t border-gray-100">
               <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-700 animate-pulse"></span>
                  Sincronizado {APP_VERSION}
               </div>
            </div>
          </aside>

          {isSidebarOpen && <div className="md:hidden absolute inset-0 bg-black/40 z-10 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-20 space-y-40 custom-scrollbar scroll-smooth">
            
            <section id="man-philosophy" className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">01. FUNDAMENTOS</span>
                <h2 className="text-7xl font-black text-gray-900 tracking-tighter leading-none italic">Análisis<br/><span className="text-red-700 not-italic">Determinist-IA.</span></h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-lg font-medium border-l-4 border-gray-100 pl-8">
                CriptoGO no intenta predecir el futuro; intenta <span className="text-gray-900 font-bold">mapear el presente</span> con precisión matemática. Eliminamos el ruido de las redes sociales y el sesgo emocional del trader mediante una arquitectura local que prioriza el flujo del dinero institucional sobre la especulación minorista.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                <div className="p-10 bg-gray-50 border border-gray-100 rounded-[2.5rem] group hover:border-red-200 transition-all shadow-sm">
                  <Globe className="text-red-700 mb-6" size={32} />
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-4">Mercado Total</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Conexión nativa con Binance y Yahoo Finance. Un único panel para Cripto, Acciones, ETFs y Divisas.</p>
                </div>
                <div className="p-10 bg-gray-900 text-white rounded-[2.5rem] group hover:bg-black transition-all shadow-2xl">
                  <Sparkles className="text-red-500 mb-6" size={32} />
                  <h4 className="font-black text-xs uppercase tracking-widest text-white mb-4">Augmented Trading</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">La Inteligencia Artificial de Google Gemini actúa como un copiloto que valida tus tesis técnicas con datos fundamentales reales.</p>
                </div>
              </div>
            </section>

            <section id="man-algorithm" className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">02. NÚCLEO TÉCNICO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">El Método de las<br/>4 Etapas de Mercado</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base max-w-3xl">
                Nuestro núcleo clasifica cada activo basándose en la posición del precio respecto a la <span className="text-red-700 font-bold italic">Media Móvil de 20 periodos (MA20)</span> y la dirección de su pendiente (slope).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-emerald-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 1: ACUMULACIÓN</h4>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-600 font-black text-sm shadow-sm">1</div>
                    </div>
                    <p className="text-xs text-emerald-800/80 leading-relaxed">
                      Lateralización horizontal. El precio "abraza" la MA20. El volumen es bajo. Indica que las manos fuertes están construyendo posiciones sin alertar al mercado.
                    </p>
                  </div>
                  <div className="p-8 rounded-[2rem] bg-emerald-900 text-white border border-emerald-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 2: ALCISTA (MARKUP)</h4>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-900 font-black text-sm">2</div>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed">
                      La MA20 apunta hacia arriba y el precio cotiza con fuerza por encima. Es la fase de máxima rentabilidad. Los retrocesos a la media son oportunidades de compra.
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-8 rounded-[2rem] bg-orange-50 border border-orange-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-orange-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 3: DISTRIBUCIÓN</h4>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-black text-sm shadow-sm">3</div>
                    </div>
                    <p className="text-xs text-orange-800/80 leading-relaxed">
                      El precio empieza a cruzar la MA20 de arriba hacia abajo con volatilidad. La pendiente se aplana. Las manos fuertes están vendiendo sus posiciones a los minoristas.
                    </p>
                  </div>
                  <div className="p-8 rounded-[2rem] bg-red-50 border border-red-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-red-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 4: BAJISTA (MARKDOWN)</h4>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-red-600 font-black text-sm shadow-sm">4</div>
                    </div>
                    <p className="text-xs text-red-800/80 leading-relaxed">
                      La MA20 apunta hacia abajo y el precio es rechazado constantemente bajo ella. Fase de destrucción de capital. Solo se recomienda estar en liquidez o en posiciones cortas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-12 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row gap-12 items-center shadow-inner">
                  <div className="p-8 bg-white rounded-3xl shadow-lg border border-gray-100">
                      <LineChart className="text-red-700" size={48} />
                  </div>
                  <div className="space-y-4">
                      <h5 className="font-black text-sm uppercase tracking-widest text-gray-900">Validación de Fuerza: RSI (14)</h5>
                      <p className="text-xs text-gray-500 leading-relaxed text-justify">
                          El Índice de Fuerza Relativa complementa las etapas: Valores <span className="text-red-700 font-bold">&gt; 70</span> indican "Sobrecompra" (Riesgo de corrección inminente) y <span className="text-emerald-600 font-bold">&lt; 30</span> indican "Sobreventa" (Oportunidad de rebote técnico).
                      </p>
                  </div>
              </div>
            </section>

            <section id="man-gemini" className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">03. INTELIGENCIA GENERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Gemini AI Engine</h2>
              </div>
              
              <div className="space-y-10">
                <p className="text-gray-600 leading-relaxed text-base">
                  CriptoGO integra modelos de lenguaje avanzados para procesar lo que los gráficos no pueden decir. Al configurar tu <strong>API Key</strong> personal de Google, desbloqueas el cerebro analítico del sistema:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all space-y-5">
                    <div className="flex items-center gap-3 text-red-700">
                      <BrainCircuit size={32} />
                      <h5 className="font-black text-xs uppercase tracking-[0.2em]">Oráculo de Mercado</h5>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Sintetiza la acción del precio, la distancia a la MA20 y el RSI en un diagnóstico semántico. Detecta anomalías que un humano tardaría horas en procesar.
                    </p>
                  </div>
                  <div className="p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all space-y-5">
                    <Globe size={32} className="text-red-700" />
                    <h5 className="font-black text-xs uppercase tracking-[0.2em]">Análisis Fundamental</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Extrae información actualizada sobre la utilidad real de un token o la salud de una corporación, clasificando su valor intrínseco en tiempo de ejecución.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900 text-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden border border-gray-800">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Cpu size={180} />
                    </div>
                    <div className="p-6 bg-red-700 rounded-3xl shadow-lg relative z-10">
                        <Info size={40} />
                    </div>
                    <div className="flex-1 space-y-4 relative z-10">
                        <h5 className="font-black text-xs uppercase tracking-widest text-red-500">Selección de Motor de Inteligencia</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                            Desde <strong>Ajustes</strong>, puedes alternar entre <span className="text-white font-bold">Gemini 3 Flash</span> (respuestas ultra-rápidas) y <span className="text-white font-bold">Gemini 3 Pro</span> (razonamiento profundo para análisis de riesgo complejo).
                        </p>
                    </div>
                </div>
              </div>
            </section>

            <section id="man-correlation" className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">04. QUANTS & CORRELACIÓN</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Coeficiente de Pearson</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base max-w-3xl">
                El módulo de <span className="font-bold italic">Correlación Pro</span> permite comparar matemáticamente cómo se mueven dos activos entre sí mediante una escala de <span className="text-gray-900 font-black">-1.0 a +1.0</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-3">Interpretación Estadística</h4>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 mt-0.5 shrink-0 shadow-sm border-2 border-white"></div>
                      <div>
                        <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider">Fuerte Positiva (&gt; 0.75)</span>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Activos "espejo". Se mueven en sincronía casi total. Ideal para estrategias de liquidez con muy bajo riesgo de divergencia.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-red-500 mt-0.5 shrink-0 shadow-sm border-2 border-white"></div>
                      <div>
                        <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">Fuerte Inversa (&lt; -0.75)</span>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Movimiento opuesto matemático. Cuando uno sube, el otro baja. Es la herramienta definitiva para coberturas (Hedge) de riesgo.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded-full bg-gray-300 mt-0.5 shrink-0 shadow-sm border-2 border-white"></div>
                      <div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Nula / Desacoplada (~ 0.0)</span>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Activos sin relación lineal. Indispensable para diversificación real de carteras: el movimiento de uno no condiciona al otro.</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 flex flex-col justify-center space-y-6 shadow-inner">
                    <div className="flex items-center gap-3">
                        <Scale className="text-red-700" size={24} />
                        <h5 className="font-black text-xs uppercase tracking-widest text-gray-900">Uso Avanzado: Pares LP</h5>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Utiliza el escáner de correlación para encontrar activos que "viajen juntos". Al proveer liquidez en DEXs (Uniswap, PancakeSwap), una correlación alta reduce drásticamente el <strong>Impermanent Loss (IL)</strong>, maximizando tus beneficios por comisiones.
                    </p>
                </div>
              </div>
            </section>

            <section id="man-lp" className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">05. GENERACIÓN DE RENDIMIENTO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Liquidez Concentrada</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                CriptoGO calcula rangos dinámicos para protocolos de liquidez (Uniswap V3 / Grid Trading) basados en la volatilidad histórica real de los últimos 30 días.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 space-y-4 shadow-sm group hover:shadow-md transition-all">
                    <ShieldCheck className="text-emerald-600" size={28} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-emerald-900">Rango Conservador</h5>
                    <p className="text-[10px] text-emerald-800/70 leading-relaxed">Cubre el 100% del movimiento histórico +5% de margen. Mínimo mantenimiento, ingresos pasivos constantes.</p>
                </div>
                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4 shadow-sm group hover:shadow-md transition-all">
                    <Zap className="text-amber-600" size={28} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-amber-900">Rango Agresivo</h5>
                    <p className="text-[10px] text-amber-800/70 leading-relaxed">Concentrado en la Desviación Estándar (±1σ). Máximo APR, alto riesgo de salida de rango (Stop Loss).</p>
                </div>
                <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-4 shadow-sm group hover:shadow-md transition-all">
                    <ArrowUpRight className="text-blue-600" size={28} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-blue-900">Rango Captación</h5>
                    <p className="text-[10px] text-blue-800/70 leading-relaxed">Diseñado para vender Activo A y comprar Activo B de forma progresiva mientras el mercado sube.</p>
                </div>
              </div>
            </section>

            <section id="man-ux" className="max-w-4xl space-y-12">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">06. EXPERIENCIA OPERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Navegación Eficiente</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <Search size={18} className="text-red-700" /> Búsqueda Inteligente (?)
                  </h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Utiliza el símbolo <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700 shadow-sm">?</code> en el buscador principal. La IA te recomendará activos con la tendencia más fuerte en ese preciso instante.
                  </p>
                </div>
                <div className="space-y-4 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <LayoutGrid size={18} className="text-red-700" /> Reordenación Dinámica
                  </h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Las tarjetas de activos son interactivas. Usa las flechas para priorizar visualmente tus activos favoritos o pulsa la estrella para moverlos al inicio de tu lista de seguimiento.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 p-12 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 group hover:border-red-200 transition-colors">
                <div className="p-8 bg-gray-900 text-white rounded-3xl shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform">
                  <MousePointer2 size={48} className="relative z-10" />
                  <div className="absolute inset-0 bg-red-700 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
                <div className="flex-1 space-y-4">
                  <h5 className="font-black text-lg uppercase tracking-tighter text-gray-900">Interacciones Clave</h5>
                  <ul className="space-y-3 text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-700"></div> Click en Título: Zoom Detallado</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-700"></div> Click en MA20: Explicación de Distancia</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-700"></div> Icono Insight: Análisis de 1 Frase</li>
                    <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-700"></div> Botón Oráculo: Diagnóstico Semántico</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="man-security" className="max-w-4xl space-y-12 pb-40">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">07. COMPROMISO DE DATOS</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-none">Tu Privacidad<br/><span className="text-red-700 italic">No es Negociable.</span></h2>
              </div>
              <div className="bg-gray-900 text-white p-16 rounded-[4rem] border border-gray-800 space-y-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                    <Lock size={260} />
                </div>
                <div className="flex items-center gap-6 text-red-500 relative z-10">
                  <ShieldCheck size={48} />
                  <h4 className="font-black text-3xl uppercase tracking-tighter italic">Arquitectura Local-First</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-[0.2em]">
                      <Database size={18} /> Almacenamiento
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed text-justify">
                      Toda tu configuración, activos favoritos y <strong>claves de API</strong> se guardan exclusivamente en el <span className="text-white font-bold">LocalStorage</span> de tu propio navegador. No existe servidor intermedio que recolecte tu actividad.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-[0.2em]">
                      <Lock size={18} /> Cero Vigilancia
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed text-justify">
                      La comunicación con Google Gemini ocurre de forma cifrada y directa desde tu dispositivo. El desarrollador de CriptoGO nunca tiene acceso a tus consultas ni a tus resultados.
                    </p>
                  </div>
                </div>
                <div className="pt-10 border-t border-gray-800 text-center relative z-10">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">
                        Para eliminar rastro permanente, utiliza el botón "Reset Memory" en Ajustes.
                    </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white md:hidden">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">Cerrar Manual Operativo</button>
        </div>
      </div>
    </div>
  );
};