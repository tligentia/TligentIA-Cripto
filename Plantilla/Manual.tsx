
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ShieldCheck, Cpu, Zap, Database, ChevronRight, Menu, Layout, 
  Lock, BarChart3, Activity, Layers, Sparkles, BookOpen, Globe, 
  TrendingUp, Search, MousePointer2, Target, Info, CheckCircle2, 
  TrendingDown, Minus, LayoutGrid, BrainCircuit, Lightbulb, Scale,
  LineChart, AlertTriangle, ArrowUpRight, Gauge, Star, ArrowUpToLine, ArrowDownToLine,
  Building2, Users, ExternalLink, Share2, Calculator, ArrowUpDown, MessageSquare, Flame,
  RefreshCw, Trash2
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
  { id: 'man-asset-card', title: 'Anatomía de la Ficha', icon: <Layout size={16} /> },
  { id: 'man-algorithm', title: 'Núcleo Algorítmico', icon: <Activity size={16} /> },
  { id: 'man-correlation', title: 'Análisis de Correlación', icon: <Calculator size={16} /> },
  { id: 'man-gemini', title: 'Motor de Inteligencia', icon: <Cpu size={16} /> },
  { id: 'man-lp', title: 'Estrategias de Liquidez', icon: <Gauge size={16} /> },
  { id: 'man-ux', title: 'Guía de Interfaz', icon: <MousePointer2 size={16} /> },
  { id: 'man-security', title: 'Arquitectura Privada', icon: <ShieldCheck size={16} /> }
];

const UIClip: React.FC<{ children: React.ReactNode, label: string }> = ({ children, label }) => (
  <div className="my-10 space-y-3">
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-gray-100"></div>
      <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{label}</span>
      <div className="h-px flex-1 bg-gray-100"></div>
    </div>
    <div className="p-6 bg-gray-50/50 rounded-[3rem] border border-gray-100 shadow-inner flex justify-center overflow-hidden">
      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 scale-90 md:scale-100 origin-center max-w-full">
        {children}
      </div>
    </div>
  </div>
);

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
      scrollContainerRef.current.scrollTo({ 
        top: element.offsetTop - 20, 
        behavior: 'smooth' 
      });
      setActiveSection(id);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
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
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-2xl leading-none">Manual</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1 hidden sm:block">Protocolo Operativo • Edición {APP_VERSION}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-700 transition-all active:scale-90">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          
          {/* SIDEBAR NAVIGATION */}
          <aside className={`absolute md:relative z-20 w-80 h-full bg-gray-50/30 border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-8 space-y-2 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 px-4">Índice</p>
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
          </aside>

          {/* MAIN CONTENT AREA */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-20 space-y-40 custom-scrollbar scroll-smooth bg-white">
            
            {/* 01. FILOSOFÍA */}
            <section id="man-philosophy" className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">01. FUNDAMENTOS</span>
                <h2 className="text-7xl font-black text-gray-900 tracking-tighter leading-none italic">Análisis<br/><span className="text-red-700 not-italic">Determinist-IA.</span></h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-lg font-medium border-l-4 border-gray-100 pl-8">
                CriptoGO no intenta predecir el futuro; intenta <span className="text-gray-900 font-bold">mapear el presente</span> con precisión matemática. Eliminamos el ruido mediante una arquitectura local que prioriza el flujo del dinero real sobre la especulación emocional. Nuestro enfoque se basa en la Teoría de Ciclos de Mercado, donde cada fase tiene un propósito y una estrategia definida.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">Métricas de Verdad</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Priorizamos datos On-Chain y de mercado directo (Binance/Yahoo) sobre opiniones de terceros. Lo que ves es el consenso real del dinero.</p>
                </div>
                <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">Soberanía de Datos</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Toda tu inteligencia operativa se queda en tu máquina. CriptoGO es una herramienta, no una plataforma de vigilancia.</p>
                </div>
              </div>
            </section>

            {/* 02. ANATOMÍA DE LA FICHA */}
            <section id="man-asset-card" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">02. ANATOMÍA OPERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">La Ficha de Activo<br/><span className="text-red-700">Panel de Control Total</span></h2>
              </div>
              
              <div className="space-y-16">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-sm"><Layout size={24} /></div>
                        <h4 className="font-black text-xl uppercase tracking-tighter text-gray-900">1. Cabecera e Identidad Dinámica</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                        La parte superior identifica el activo, su origen (Binance para cripto, Yahoo para bolsa) y el **Termómetro MA20**. Este porcentaje indica la distancia actual del precio respecto a su media móvil de 20 periodos. Si el valor es muy alto (ej: +20%), el activo está "caliente" y el riesgo de corrección aumenta. Si es bajo o negativo, puede ser una oportunidad de rebote.
                    </p>

                    <UIClip label="RECORTES: CABECERA E IDENTIDAD">
                        <div className="flex justify-between items-start w-[320px]">
                            <div className="flex items-center gap-2">
                                <Star size={20} className="text-gray-900 fill-current" />
                                <h3 className="text-3xl font-black">BTC</h3>
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded font-mono text-gray-400 uppercase">Binance</span>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black">91.471 US$</p>
                                <p className="text-[10px] font-bold text-red-700">▲ 3.75% vs MA20</p>
                            </div>
                        </div>
                    </UIClip>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-700 rounded-2xl text-white shadow-lg"><Layers size={24} /></div>
                        <h4 className="font-black text-xl uppercase tracking-tighter text-gray-900">2. Matriz de Ciclos (D/W/M)</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                        Analizamos tres marcos temporales simultáneamente para evitar señales falsas. Cada tarjeta de periodo muestra la **Etapa Algorítmica**, el **RSI (Fuerza Relativa)** y los **Puntos Pivote**.
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600">
                      <li className="flex gap-3 items-start"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <div><strong>RSI:</strong> Se torna ROJO en sobrecompra (&gt;70) y VERDE en sobreventa (&lt;30).</div></li>
                      <li className="flex gap-3 items-start"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" /> <div><strong>Pivotes (R1/S1):</strong> Niveles matemáticos de soporte (suelo) y resistencia (techo) para el periodo.</div></li>
                    </ul>

                    <UIClip label="RECORTE: MATRIZ DE CICLOS">
                        <div className="flex gap-4">
                            <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 w-32 flex flex-col items-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase">DIARIO</span>
                                <TrendingUp size={24} className="text-emerald-900 my-2" />
                                <span className="text-xs font-black text-emerald-900">Alcista</span>
                                <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden"><div className="w-[58%] h-full bg-emerald-500"></div></div>
                                <span className="text-[10px] font-mono mt-1">RSI: 58.9</span>
                            </div>
                            <div className="p-4 rounded-2xl border-2 border-red-100 bg-red-50 w-32 flex flex-col items-center">
                                <span className="text-[8px] font-black text-gray-400 uppercase">SEMANAL</span>
                                <TrendingDown size={24} className="text-red-600 my-2" />
                                <span className="text-xs font-black text-red-600">Bajista</span>
                                <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden"><div className="w-[41%] h-full bg-red-500"></div></div>
                                <span className="text-[10px] font-mono mt-1">RSI: 41.4</span>
                            </div>
                        </div>
                    </UIClip>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gray-900 text-red-500 rounded-2xl shadow-xl"><Sparkles size={24} /></div>
                        <h4 className="font-black text-xl uppercase tracking-tighter text-gray-900">3. Terminal de Inteligencia IA</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                        Mediante el uso de Gemini, CriptoGO sintetiza millones de datos en diagnósticos legibles. El **Oráculo** analiza la tendencia técnica, el **Insight** te da una frase de acción inmediata y **Estrategias** adapta el activo a tu perfil de riesgo.
                    </p>

                    <UIClip label="RECORTE: BOTONERA DE INTELIGENCIA">
                        <div className="grid grid-cols-2 gap-2 w-[300px]">
                            <div className="bg-slate-950 text-white p-2 rounded-lg text-center font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-md"><Sparkles size={10}/> Oráculo</div>
                            <div className="bg-red-950 text-white p-2 rounded-lg text-center font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-md"><Zap size={10}/> Insight</div>
                            <div className="bg-blue-950 text-white p-2 rounded-lg text-center font-black text-[9px] uppercase tracking-widest shadow-md">Fundamental</div>
                            <div className="bg-emerald-950 text-white p-2 rounded-lg text-center font-black text-[9px] uppercase tracking-widest shadow-md">Estrategias</div>
                        </div>
                    </UIClip>
                </div>
              </div>
            </section>

            {/* 03. ALGORITMO */}
            <section id="man-algorithm" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">03. NÚCLEO TÉCNICO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Las 4 Etapas del Ciclo</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                Nuestro motor clasifica el comportamiento del precio en cuatro cuadrantes definidos por la interacción con la **Media Móvil de 20 periodos (MA20)**.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 space-y-4 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-emerald-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 1: ACUMULACIÓN</h4>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-black text-sm shadow-sm border border-emerald-100">1</div>
                    </div>
                    <p className="text-xs text-emerald-800/80 leading-relaxed flex-1">
                      Lateralización horizontal. El precio abraza la MA20 sin dirección clara. Indica que las instituciones están construyendo posiciones. **Acción: Vigilar.**
                    </p>
                  </div>
                  
                  <div className="p-8 rounded-[2.5rem] bg-emerald-900 text-white space-y-4 shadow-2xl relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80} /></div>
                    <div className="flex items-center justify-between relative z-10">
                      <h4 className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 2: ALCISTA (MARKUP)</h4>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-900 font-black text-sm">2</div>
                    </div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10 flex-1">
                      Tendencia fuerte confirmada. La MA20 apunta hacia arriba y el precio cotiza con fuerza por encima. Es la zona de máxima rentabilidad. **Acción: Comprar.**
                    </p>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-orange-50 border border-orange-100 space-y-4 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-orange-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 3: DISTRIBUCIÓN</h4>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 font-black text-sm shadow-sm border border-orange-100">3</div>
                    </div>
                    <p className="text-xs text-orange-800/80 leading-relaxed flex-1">
                      El precio empieza a cruzar la MA20 con alta volatilidad. Las manos fuertes venden a los minoristas. Inseguridad de mercado. **Acción: Esperar.**
                    </p>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-red-50 border border-red-100 space-y-4 shadow-sm relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown size={80} /></div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-red-900 font-black text-[10px] uppercase tracking-[0.2em]">ETAPA 4: BAJISTA (MARKDOWN)</h4>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-600 font-black text-sm shadow-sm border border-red-100">4</div>
                    </div>
                    <p className="text-xs text-red-800/80 leading-relaxed flex-1">
                      La MA20 apunta hacia abajo y el precio es rechazado bajo ella. Fase de destrucción de capital y pánico. **Acción: Vender / Proteger.**
                    </p>
                  </div>
              </div>
            </section>

            {/* 04. CORRELACIÓN */}
            <section id="man-correlation" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">04. ANÁLISIS CUANTITATIVO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Correlación y Pearson</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                El módulo de correlación permite comparar matemáticamente cómo se mueven dos activos entre sí mediante el **Coeficiente de Pearson**. Esta herramienta es vital para la diversificación real.
              </p>
              
              <UIClip label="RECORTE: VISUALIZADOR DE CORRELACIÓN">
                <div className="w-[450px] space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-black"></div> <span className="font-black uppercase tracking-tight">BTC</span> <span className="text-gray-300 text-[10px]">vs</span> <div className="w-2 h-2 rounded-full bg-red-600"></div> <span className="font-black text-red-600 uppercase tracking-tight">ETH</span></div>
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"><Calculator size={14} className="text-emerald-600"/> <span className="text-xl font-black text-emerald-600 tracking-tighter">0.9241</span></div>
                    </div>
                    <div className="h-24 w-full flex items-end gap-1 opacity-10">
                        {Array.from({length: 24}).map((_, i) => <div key={i} className="flex-1 bg-red-600" style={{height: `${40 + Math.random()*60}%`}}></div>)}
                    </div>
                </div>
              </UIClip>

              <div className="bg-gray-900 text-white p-10 rounded-[3rem] space-y-6 shadow-2xl">
                 <div className="flex items-center gap-3 text-red-500"><Info size={24} /> <h5 className="font-black text-sm uppercase tracking-widest">Interpretación del Coeficiente</h5></div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <span className="text-emerald-500 font-black text-lg">+1.0</span>
                      <p className="text-[11px] text-gray-400">**Directa Fuerte:** Los activos se mueven en espejo. Malo para diversificar, excelente para Liquidez V3.</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-400 font-black text-lg">0.0</span>
                      <p className="text-[11px] text-gray-400">**Nula:** Movimientos independientes. El santo grial de la diversificación de portafolio.</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-red-500 font-black text-lg">-1.0</span>
                      <p className="text-[11px] text-gray-400">**Inversa:** Cuando uno sube, el otro cae. Ideal para coberturas (Hedge) de riesgo agresivas.</p>
                    </div>
                 </div>
              </div>
            </section>

            {/* 05. GEMINI ENGINE */}
            <section id="man-gemini" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">05. INTELIGENCIA GENERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Gemini AI Engine</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                CriptoGO integra modelos de lenguaje de última generación para procesar lo que los gráficos no pueden decir. Al configurar tu **API Key** personal, desbloqueas el cerebro analítico del sistema.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm hover:shadow-xl transition-all space-y-5 group">
                    <div className="flex items-center gap-3 text-gray-900 group-hover:text-red-700 transition-colors">
                      <BrainCircuit size={32} />
                      <h5 className="font-black text-xs uppercase tracking-[0.2em]">Oráculo de Mercado</h5>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      "Analiza la interacción entre el RSI diario y el semanal, detecta divergencias ocultas y te ofrece un veredicto en lenguaje natural."
                    </p>
                  </div>
                  <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm hover:shadow-xl transition-all space-y-5 group">
                    <div className="flex items-center gap-3 text-gray-900 group-hover:text-blue-700 transition-colors">
                      <Building2 size={32} />
                      <h5 className="font-black text-xs uppercase tracking-[0.2em]">Análisis Fundamental</h5>
                      <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[8px] font-black">PRO</div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                      "Resume la utilidad real del token, la salud de la tesorería de una empresa y los riesgos regulatorios actuales."
                    </p>
                  </div>
              </div>
            </section>

            {/* 06. LIQUIDEZ */}
            <section id="man-lp" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">06. GENERACIÓN DE RENDIMIENTO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Estrategias de Liquidez</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                Dentro del panel de correlación, CriptoGO calcula rangos matemáticos óptimos para protocolos como **Uniswap V3** o **Grid Trading**.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center group hover:bg-emerald-100 transition-colors">
                    <ShieldCheck className="text-emerald-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-emerald-900 mb-2">CONSERVADOR</h5>
                    <p className="text-[10px] text-emerald-800/70">Cubre el 100% del rango histórico + un margen del 5%. Mínimo mantenimiento, bajo riesgo de IL.</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-amber-50 border border-amber-100 flex flex-col items-center text-center group hover:bg-amber-100 transition-colors">
                    <Zap className="text-amber-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-amber-900 mb-2">AGRESIVO</h5>
                    <p className="text-[10px] text-amber-800/70">Concentrado en la volatilidad inmediata (1 Desviación Estándar). Máximo APR, alto riesgo de salirse de rango.</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex flex-col items-center text-center group hover:bg-blue-100 transition-colors">
                    <ArrowUpRight className="text-blue-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-blue-900 mb-2">CAPTACIÓN</h5>
                    <p className="text-[10px] text-blue-800/70">Diseñado para comprar el activo secundario de forma escalonada mientras el precio sube. Estrategia de rotación.</p>
                </div>
              </div>
            </section>

            {/* 07. INTERFAZ Y TRUCOS */}
            <section id="man-ux" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">07. EXPERIENCIA OPERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Guía de Interfaz</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <Search size={18} className="text-red-700" /> Búsqueda IA Inteligente
                  </h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Utiliza el buscador con comandos especiales para que la IA te recomiende activos con el mejor **Momentum** actual.
                  </p>
                  <ul className="text-[10px] text-gray-400 space-y-2 list-none">
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700 w-10 text-center">?</code> <span>Mejor valor equilibrado (Best Setup).</span></li>
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700 w-10 text-center">?+</code> <span>Crecimiento acelerado a corto plazo (Short Term).</span></li>
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700 w-10 text-center">?++</code> <span>Tendencia estructural sólida a medio plazo (Structural).</span></li>
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700 w-10 text-center">?-</code> <span>Activos altamente volátiles / "High Risk High Reward".</span></li>
                  </ul>
                </div>
                <div className="space-y-4 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner flex flex-col justify-center">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <LayoutGrid size={18} className="text-red-700" /> Gestión de Portafolio
                  </h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Usa las flechas de reordenación para priorizar tus activos. La estrella (favorito) fijará el activo en el primer lugar de la lista y resaltará su borde en color negro profundo.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border-2 border-gray-200 p-12 space-y-10 shadow-lg">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-red-700 shadow-xl border border-gray-800"><ExternalLink size={32} /></div>
                    <div>
                      <h4 className="font-black text-2xl text-gray-900 uppercase tracking-tighter leading-none">Llamadas Externas Directas</h4>
                      <p className="text-[10px] text-gray-400 font-black uppercase mt-1 tracking-widest">Validación Externa en un Click</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed text-justify">
                    Para eliminar el error humano y ganar velocidad, cada tarjeta integra una **botonera inteligente en su pie**. Estas llamadas no solo abren la web externa, sino que inyectan el Ticker actual para que no tengas que escribir nada.
                  </p>

                  <UIClip label="RECORTE: PIE DE TARJETA (VALIDACIÓN)">
                    <div className="w-[350px] flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2.5 text-blue-900">
                                <i className="fa-solid fa-chart-line text-[14px]" title="TradingView"></i>
                                <i className="fa-brands fa-yahoo text-[14px]" title="Yahoo"></i>
                                <i className="fa-solid fa-coins text-[14px]" title="CoinMarketCap"></i>
                            </div>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <div className="flex items-center gap-2.5 text-gray-400">
                                <i className="fa-solid fa-robot text-[14px]" title="ChatGPT"></i>
                                <i className="fa-solid fa-bolt text-[14px]" title="Grok"></i>
                                <i className="fa-solid fa-infinity text-[14px]" title="Perplexity"></i>
                            </div>
                        </div>
                        <div className="flex gap-2">
                           <div className="p-1.5 bg-gray-100 rounded text-gray-400"><RefreshCw size={12}/></div>
                           <div className="p-1.5 bg-gray-100 rounded text-gray-400"><Trash2 size={12}/></div>
                        </div>
                    </div>
                  </UIClip>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                    <div className="space-y-4">
                        <h5 className="font-black uppercase tracking-widest text-red-700 border-b border-red-50 pb-2 flex items-center gap-2"><LineChart size={14}/> Plataformas de Datos</h5>
                        <ul className="space-y-3 text-gray-500">
                            <li><strong className="text-gray-900">TradingView:</strong> Abre el gráfico técnico profesional con velas de 1 día y medias móviles automáticas.</li>
                            <li><strong className="text-gray-900">Yahoo Finanzas:</strong> Acceso a estados financieros, sentimiento de mercado minorista y noticias corporativas/económicas.</li>
                            <li><strong className="text-gray-900">CoinMarketCap:</strong> Salta directo a la ficha técnica: Market Cap, Suministro circulante, rankings y comparativas directas.</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h5 className="font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2"><Sparkles size={14}/> Motores de Consulta IA</h5>
                        <ul className="space-y-3 text-gray-500">
                            <li><strong className="text-gray-900">ChatGPT / Grok:</strong> Se abre un chat con un prompt pre-inyectado que solicita un análisis experto técnico y fundamental del activo.</li>
                            <li><strong className="text-gray-900">Perplexity:</strong> Realiza una búsqueda en internet en tiempo real para detectar noticias de última hora o eventos "cisne negro" inminentes.</li>
                        </ul>
                    </div>
                  </div>
              </div>
            </section>

            {/* 08. PRIVACIDAD */}
            <section id="man-security" className="max-w-4xl space-y-12 pb-40 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">08. PRIVACIDAD</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Seguridad Total</h2>
              </div>
              <div className="bg-gray-900 text-white p-16 rounded-[4rem] border border-gray-800 space-y-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] animate-pulse">
                    <ShieldCheck size={260} />
                </div>
                <div className="flex items-center gap-6 text-red-500 relative z-10">
                  <Lock size={48} className="animate-bounce" />
                  <h4 className="font-black text-3xl uppercase tracking-tighter italic">Arquitectura Local-First</h4>
                </div>
                <div className="space-y-6 relative z-10 text-justify max-w-2xl">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Toda tu configuración, **favoritos y claves de API** se guardan exclusivamente en el <span className="text-white font-bold underline decoration-red-700 underline-offset-4">LocalStorage</span> de tu navegador. No existe un servidor intermedio que recolecte tu actividad o tus consultas de IA.
                    </p>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-4">
                      <div className="p-2 bg-red-700/20 rounded-lg text-red-500 mt-1"><Flame size={18} /></div>
                      <div>
                        <h5 className="text-[10px] font-black uppercase text-white tracking-widest mb-1">Borrado Seguro</h5>
                        <p className="text-[10px] text-gray-500 leading-relaxed">En el panel de Ajustes dispones del botón "Reset Memory" que purga instantáneamente cualquier rastro de datos en el dispositivo de forma irreversible.</p>
                      </div>
                    </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* MOBILE FOOTER ACTION */}
        <div className="p-6 border-t border-gray-100 bg-white md:hidden">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">Cerrar Manual Operativo</button>
        </div>
      </div>
    </div>
  );
};
