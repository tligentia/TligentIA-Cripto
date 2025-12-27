import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, HelpCircle, ShieldCheck, Cpu, Zap, Database, ChevronRight, Menu, Layout, Key, Lock, ArrowRight, BarChart3, Activity, Layers, Sparkles, BookOpen, Globe } from 'lucide-react';
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
  { id: 'man-intro', title: 'Visión General', icon: <Layout size={16} /> },
  { id: 'man-method', title: 'Método CriptoGO', icon: <Activity size={16} /> },
  { id: 'man-ai', title: 'Inteligencia Gemini', icon: <Cpu size={16} /> },
  { id: 'man-correlation', title: 'Correlación y LP', icon: <Layers size={16} /> },
  { id: 'man-directory', title: 'Guía y Recursos', icon: <BookOpen size={16} /> },
  { id: 'man-security', title: 'Seguridad y Datos', icon: <ShieldCheck size={16} /> },
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
      <div className="bg-white w-full h-full md:h-[92vh] md:max-w-6xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
        
        {/* TOP BAR */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:hidden hover:bg-gray-200 rounded-lg text-gray-900"><Menu size={20} /></button>
            <div className="p-2 bg-gray-900 rounded-xl text-white shadow-lg shadow-black/10 hidden sm:block"><BookOpen size={20} /></div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-lg leading-tight">Manual Operativo</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">Sincronizado con v.{APP_VERSION}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-700 transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          
          {/* SIDEBAR */}
          <aside className={`absolute md:relative z-20 w-64 h-full bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-6 space-y-1">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Índice Técnico</p>
              {SECTIONS.map((section) => (
                <button key={section.id} onClick={() => scrollToSection(section.id)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${activeSection === section.id ? 'bg-red-50 text-red-700 border-l-4 border-red-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <div className="flex items-center gap-3">
                    <span className={activeSection === section.id ? 'text-red-700' : 'text-gray-400'}>{section.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tight transition-all ${activeSection === section.id ? 'translate-x-1' : ''}`}>{section.title}</span>
                  </div>
                  {activeSection === section.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
            <div className="mt-auto p-6 bg-gray-50/50 border-t border-gray-100">
               <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-700 animate-pulse"></span>
                  Sistema Operativo {APP_VERSION}
               </div>
            </div>
          </aside>

          {isSidebarOpen && <div className="md:hidden absolute inset-0 bg-black/20 z-10 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

          {/* CONTENT AREA */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-14 space-y-24 custom-scrollbar scroll-smooth">
            
            {/* 01. INTRO */}
            <section id="man-intro" className="space-y-8">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">01. Ecosistema CriptoGO</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Inteligencia<br/><span className="text-red-700 italic underline decoration-gray-900 decoration-4">Sincronizada</span></h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base font-medium max-w-2xl">
                Bienvenido a la plataforma definitiva de análisis técnico y fundamental. Este entorno integra datos de mercado en tiempo real de <span className="text-gray-900 font-bold">Binance</span> (Cripto) y <span className="text-gray-900 font-bold">Yahoo Finance</span> (Bolsa) con el motor de razonamiento de Google Gemini.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl group hover:border-red-200 transition-all">
                  <BarChart3 className="text-red-700 mb-4" size={24} />
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-2">Visión Multi-Activo</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Sigue criptomonedas, ETFs, acciones y divisas en una sola interfaz unificada bajo el mismo método de análisis.</p>
                </div>
                <div className="p-6 bg-gray-900 text-white rounded-3xl group hover:bg-black transition-all">
                  <Sparkles className="text-red-500 mb-4" size={24} />
                  <h4 className="font-black text-xs uppercase tracking-widest text-white mb-2">IA Gemini Inside</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">Análisis fundamental, estrategias personalizadas y oráculo de mercado impulsado por modelos 2.5 y 3.0.</p>
                </div>
              </div>
            </section>

            {/* 02. MÉTODO */}
            <section id="man-method" className="space-y-8">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">02. Análisis Técnico</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">El Algoritmo<br/>de las 4 Fases</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                Basado en el análisis de flujo institucional y regresión a la media. La <span className="text-red-700 font-bold">MA20 (Media Móvil de 20 periodos)</span> es el eje central.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 1, name: 'Acumulación', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', desc: 'Fase lateral cerca de la media. El interés está naciendo.' },
                  { id: 2, name: 'Alcista', color: 'bg-blue-50 border-blue-200 text-blue-700', desc: 'Precio sobre MA20 en expansión. Momento óptimo de compra.' },
                  { id: 3, name: 'Distribución', color: 'bg-orange-50 border-orange-200 text-orange-700', desc: 'Pérdida de fuerza, agotamiento. Riesgo de giro inminente.' },
                  { id: 4, name: 'Bajista', color: 'bg-red-50 border-red-200 text-red-700', desc: 'Precio bajo MA20. Protección de capital y ventas.' }
                ].map(fase => (
                  <div key={fase.id} className={`p-5 rounded-3xl border ${fase.color}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-black">{fase.id}</span>
                      <h5 className="font-black uppercase tracking-widest text-xs">{fase.name}</h5>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed">{fase.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 03. IA */}
            <section id="man-ai" className="space-y-8">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">03. Inteligencia Artificial</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Motor Gemini<br/>y Oráculo</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                Para activar la IA, introduce tu <span className="font-bold">API Key</span> en Ajustes. El sistema permite:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl text-red-700 h-fit"><Sparkles size={18} /></div>
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-tight text-gray-900">Oráculo de Mercado</h5>
                    <p className="text-[11px] text-gray-500">Analiza el contexto técnico (Precio, RSI, MA20) y genera una opinión sesgada al riesgo en segundos.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl text-blue-700 h-fit"><Globe size={18} /></div>
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-tight text-gray-900">Análisis Fundamental</h5>
                    <p className="text-[11px] text-gray-500">Extrae la identidad, valor y utilidad de cualquier activo sin salir de la aplicación.</p>
                  </div>
                </li>
              </ul>
              <div className="bg-indigo-900 text-white p-6 rounded-[2rem] border border-indigo-800 shadow-xl">
                 <div className="flex items-center gap-2 mb-3">
                    <Key size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tip de Seguridad</span>
                 </div>
                 <p className="text-[11px] text-indigo-200 leading-relaxed">
                   Usa el atajo <code className="bg-indigo-800 px-1.5 py-0.5 rounded text-white font-mono">OK</code> o <code className="bg-indigo-800 px-1.5 py-0.5 rounded text-white font-mono">CV</code> en el campo de API Key para cargar claves de sistema de forma automática.
                 </p>
              </div>
            </section>

            {/* 04. CORRELACIÓN */}
            <section id="man-correlation" className="space-y-8">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">04. Avanzado</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Correlación<br/>y Liquidez LP</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                El motor de correlación utiliza el <span className="font-bold">Coeficiente de Pearson</span> para comparar dos activos.
              </p>
              <div className="space-y-4">
                <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-2">
                    <Layers size={16} className="text-red-700" /> Estrategias de Rango (Uniswap V3)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Conservador</span>
                      <p className="text-[10px] text-gray-400 leading-tight">Rango amplio basado en históricos. Mínimo Impermanent Loss.</p>
                    </div>
                    <div className="space-y-2 border-l border-gray-100 pl-4">
                      <span className="text-[10px] font-black text-amber-600 uppercase">Agresivo</span>
                      <p className="text-[10px] text-gray-400 leading-tight">Concentrado en el precio actual ±1σ. Máximo APR.</p>
                    </div>
                    <div className="space-y-2 border-l border-gray-100 pl-4">
                      <span className="text-[10px] font-black text-blue-600 uppercase">Captación</span>
                      <p className="text-[10px] text-gray-400 leading-tight">Rango superior para rotar activos o tomar beneficios.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 05. GUIA */}
            <section id="man-directory" className="space-y-8">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">05. Conocimiento</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Directorio<br/>DeFi Dinámico</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">
                La sección <span className="font-bold">GUIA</span> se sincroniza con una base de datos maestra en la nube, ofreciéndote acceso directo a Wallets, DEXs, Agregadores y herramientas de fiscalidad verificadas.
              </p>
              <div className="flex flex-wrap gap-2">
                 {['Wallets', 'DEXs', 'Lending', 'Trackers', 'On-Chain'].map(tag => (
                   <span key={tag} className="px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase">{tag}</span>
                 ))}
              </div>
            </section>

            {/* 06. SEGURIDAD */}
            <section id="man-security" className="space-y-8 pb-20">
              <div className="space-y-2">
                <span className="text-red-700 font-black text-[10px] uppercase tracking-[0.4em]">06. Blindaje Corporativo</span>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Protección y<br/>Privacidad</h2>
              </div>
              <div className="bg-red-50 border border-red-100 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 text-red-700">
                  <ShieldCheck size={28} />
                  <span className="font-black text-sm uppercase tracking-[0.2em]">Hash Volátil Local</span>
                </div>
                <div className="space-y-4 text-xs text-gray-600 leading-relaxed font-medium">
                  <p>
                    1. <strong>Sin Servidores:</strong> No almacenamos tus claves ni PINs en bases de datos externas. Todo reside en el <code className="bg-white/50 px-1 rounded">LocalStorage</code> de tu navegador.
                  </p>
                  <p>
                    2. <strong>Cifrado XOR:</strong> Las claves sensibles se ofuscan mediante algoritmos de transposición simétrica utilizando la raíz del dominio como semilla.
                  </p>
                  <p>
                    3. <strong>Autobloqueo:</strong> Al pulsar <span className="text-red-700 font-bold uppercase">"Reset Memory"</span> en el panel de Ajustes, se borran instantáneamente todos los registros de sesión, activos favoritos y configuraciones de IA de forma irreversible.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="p-6 border-t border-gray-100 bg-white md:hidden">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Cerrar Manual</button>
        </div>
      </div>
    </div>
  );
};