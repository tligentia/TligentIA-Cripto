
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Database, ChevronRight, Search, 
  Repeat, Eye, EyeOff, Plus, Trash2, Edit2, FileText, Play,
  ExternalLink, BrainCircuit, Zap
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { INITIAL_TOOLS, INITIAL_PLATFORMS, MODAL_CONTENT, GEMINI_LABS } from '../constants';

// --- SUB-COMPONENTES (EXTRACCION PARA EVITAR PERDIDA DE FOCO) ---

interface ResourceCardProps {
  item: any;
  isTool: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  removeResourceLink: (categoryId: string, linkName: string, isTool: boolean) => void;
  addResourceLink: (categoryId: string, isTool: boolean) => void;
  newLink: { name: string; url: string };
  setNewLink: (link: { name: string; url: string }) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  item, 
  isTool, 
  editingId, 
  setEditingId, 
  removeResourceLink, 
  addResourceLink, 
  newLink, 
  setNewLink 
}) => (
  <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all flex flex-col group h-full relative">
    <div className="flex gap-6 items-start mb-5">
      <div className="text-4xl grayscale group-hover:grayscale-0 transition-all flex-shrink-0 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-black text-gray-900 uppercase text-sm tracking-tight truncate leading-none">
            {item.title}
          </h4>
          <button 
            onClick={() => setEditingId(editingId === item.id ? null : item.id)} 
            className={`p-2 rounded-lg transition-colors ${editingId === item.id ? 'text-red-700 bg-red-50' : 'text-gray-400 hover:text-red-700 hover:bg-gray-50'}`}
          >
            <Edit2 size={16} />
          </button>
        </div>
        <p className="text-gray-500 text-[11px] font-medium leading-relaxed mt-1 pr-4">
          {item.desc}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-2">
      {item.links.map((link: any) => (
        <div key={link.name} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl group/link hover:border-red-200 hover:bg-red-50 transition-all">
          <a 
            href={link.url} 
            target="_blank" 
            rel="noreferrer" 
            className="text-[10px] font-black text-gray-800 uppercase tracking-wide hover:text-red-700 transition-colors"
          >
            {link.name}
          </a>
          {editingId === item.id && (
            <button 
              onClick={() => removeResourceLink(item.id, link.name, isTool)} 
              className="text-gray-400 hover:text-red-700 transition-colors ml-1"
            >
              <Trash2 size={12} />
            </button>
          )}
          <ExternalLink size={10} className="text-gray-300 group-hover/link:text-red-400" />
        </div>
      ))}
    </div>

    {editingId === item.id && (
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Ej: MetaMask" 
              value={newLink.name} 
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })} 
              className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">URL</label>
            <input 
              type="text" 
              placeholder="https://..." 
              value={newLink.url} 
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} 
              className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all" 
            />
          </div>
        </div>
        <button 
          onClick={() => addResourceLink(item.id, isTool)} 
          className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black hover:shadow-lg transition-all active:scale-95"
        >
          <Plus size={14} /> Añadir
        </button>
      </div>
    )}
  </div>
);

interface ResultBoxProps {
  id: string;
  label: string;
  res: { loading: boolean; text: string } | undefined;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAction?: () => void;
}

const ResultBox: React.FC<ResultBoxProps> = ({ id, label, res, isExpanded, onToggleExpand, onAction }) => {
  if (!res && id.startsWith('quadrant-')) {
      return (
          <button 
              onClick={onAction}
              className="w-full text-left bg-gray-50 hover:bg-red-50 rounded-2xl border border-dashed border-gray-300 hover:border-red-300 transition-all group p-5 flex items-center justify-between"
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-red-700 group-hover:text-white transition-colors">
                      <Play size={12} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-red-700">Aprender más</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-red-700 group-hover:translate-x-1 transition-all" />
          </button>
      );
  }

  if (!res) return null;

  return (
    <div className="w-full text-left bg-white rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-200">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <MessageSquare size={14} className="text-red-700" /> {label}
        </div>
        <button onClick={() => onToggleExpand(id)} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-700 flex items-center gap-1">
          {isExpanded ? <><EyeOff size={10} /> Resumir</> : <><Eye size={10} /> Ver Todo</>}
        </button>
      </div>
      <div className="p-6">
        {res.loading ? (
          <div className="py-10 flex flex-col items-center justify-center"><Repeat size={24} className="text-gray-300 animate-spin mb-3" /><p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sintetizando...</p></div>
        ) : (
          <div className={`text-gray-900 text-[13px] leading-relaxed whitespace-pre-wrap font-sans font-semibold transition-all duration-300 ${!isExpanded ? 'line-clamp-4 opacity-80' : 'opacity-100'}`}>{res.text}</div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Guia: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'herramientas' | 'ia' | 'teoria'>('herramientas');
  const [aiResults, setAiResults] = useState<Record<string, { loading: boolean, text: string }>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [formStates, setFormStates] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({ name: '', url: '' });

  const [customTools, setCustomTools] = useState(() => {
    const saved = localStorage.getItem('guia_custom_tools_v4');
    return saved ? JSON.parse(saved) : INITIAL_TOOLS;
  });

  const [customPlatforms, setCustomPlatforms] = useState(() => {
    const saved = localStorage.getItem('guia_custom_platforms_v4');
    return saved ? JSON.parse(saved) : INITIAL_PLATFORMS;
  });

  useEffect(() => { localStorage.setItem('guia_custom_tools_v4', JSON.stringify(customTools)); }, [customTools]);
  useEffect(() => { localStorage.setItem('guia_custom_platforms_v4', JSON.stringify(customPlatforms)); }, [customPlatforms]);

  const toggleExpand = (id: string) => setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));

  const addResourceLink = (categoryId: string, isTool: boolean) => {
    if (!newLink.name || !newLink.url) return;
    const setter = isTool ? setCustomTools : setCustomPlatforms;
    setter((prev: any) => prev.map((cat: any) => cat.id === categoryId ? { ...cat, links: [...cat.links, { ...newLink }] } : cat));
    setNewLink({ name: '', url: '' });
  };

  const removeResourceLink = (categoryId: string, linkName: string, isTool: boolean) => {
    const setter = isTool ? setCustomTools : setCustomPlatforms;
    setter((prev: any) => prev.map((cat: any) => cat.id === categoryId ? { ...cat, links: cat.links.filter((l: any) => l.name !== linkName) } : cat));
  };

  const handleAiAction = async (labId: string, promptTemplate: string, inputs: any[] = []) => {
    if (!process.env.API_KEY) return;
    setAiResults(prev => ({ ...prev, [labId]: { loading: true, text: prev[labId]?.text || '' } }));
    let finalPrompt = promptTemplate;
    inputs.forEach(input => {
      const val = formStates[`${labId}-${input.id}`] || (input.options ? input.options[0] : '');
      finalPrompt = finalPrompt.replace(`{${input.id}}`, val);
    });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: finalPrompt, config: { temperature: 0.7 } });
      setAiResults(prev => ({ ...prev, [labId]: { loading: false, text: response.text || 'Sin respuesta' } }));
      setExpandedResults(prev => ({ ...prev, [labId]: true }));
    } catch (e) {
      setAiResults(prev => ({ ...prev, [labId]: { loading: false, text: 'Error en la conexión.' } }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2 px-6 animate-in fade-in duration-700">
      <div className="flex justify-center mb-10">
        <div className="flex w-full max-w-3xl bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          {[
            { id: 'herramientas', label: 'Recursos', icon: Database }, 
            { id: 'ia', label: 'Laboratorio', icon: BrainCircuit }, 
            { id: 'teoria', label: 'Documentación', icon: FileText }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-white shadow-md text-red-700' : 'text-gray-400 hover:text-gray-700 hover:bg-white/50'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'herramientas' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
          <div>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 pl-1">
              <Zap size={14} className="text-red-700" /> DeFi Essentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {customTools.map((tool: any) => (
                <ResourceCard 
                  key={tool.id} 
                  item={tool} 
                  isTool={true} 
                  editingId={editingId}
                  setEditingId={setEditingId}
                  removeResourceLink={removeResourceLink}
                  addResourceLink={addResourceLink}
                  newLink={newLink}
                  setNewLink={setNewLink}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 pl-1">
              <Search size={14} className="text-red-700" /> Inteligencia de Mercado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {customPlatforms.map((plat: any) => (
                <ResourceCard 
                  key={plat.id} 
                  item={plat} 
                  isTool={false}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  removeResourceLink={removeResourceLink}
                  addResourceLink={addResourceLink}
                  newLink={newLink}
                  setNewLink={setNewLink}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ia' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 max-w-4xl mx-auto">
          {GEMINI_LABS.map((lab) => (
            <div key={lab.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3 flex items-center gap-3">{lab.title} <Sparkles size={24} className="text-red-700" /></h3>
              <p className="text-gray-500 text-sm mb-10 max-w-xl font-medium leading-relaxed">{lab.desc}</p>
              <div className="flex flex-col md:flex-row gap-5 w-full items-end justify-center mb-2">
                {lab.inputs.map(input => (
                  <div key={input.id} className="flex-1 w-full text-left">
                    {input.label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{input.label}</label>}
                    {input.type === 'select' ? (
                      <select className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-red-700/20" onChange={(e) => setFormStates(prev => ({ ...prev, [`${lab.id}-${input.id}`]: e.target.value }))}>
                        {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={input.type} placeholder={input.placeholder} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-700/20" onChange={(e) => setFormStates(prev => ({ ...prev, [`${lab.id}-${input.id}`]: e.target.value }))} />
                    )}
                  </div>
                ))}
                <button onClick={() => handleAiAction(lab.id, lab.prompt, lab.inputs)} disabled={aiResults[lab.id]?.loading} className="h-12 px-8 bg-gray-900 hover:bg-red-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-gray-200 hover:shadow-red-200">
                  {aiResults[lab.id]?.loading ? <Repeat className="animate-spin" size={18} /> : <Sparkles size={18} />} {lab.buttonText}
                </button>
              </div>
              <ResultBox 
                id={lab.id} 
                label="Resultado" 
                res={aiResults[lab.id]} 
                isExpanded={!!expandedResults[lab.id]}
                onToggleExpand={toggleExpand}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'teoria' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-2">
          {Object.entries(MODAL_CONTENT).map(([key, content]) => (
            <div key={key} className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col relative overflow-hidden group h-full">
              <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity"><content.icon size={150} /></div>
              <div className="flex items-center gap-5 mb-6 relative z-10">
                <div className={`p-4 rounded-2xl bg-gray-50 ${content.color} shadow-inner`}><content.icon size={28} /></div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{content.title}</h3>
              </div>
              <p className="text-gray-500 text-[12px] leading-relaxed mb-6 font-medium relative z-10">{content.body}</p>
              
              <div className="relative z-10">
                <ResultBox 
                    id={`quadrant-${content.id}`} 
                    label="Resultado" 
                    res={aiResults[`quadrant-${content.id}`]}
                    isExpanded={!!expandedResults[`quadrant-${content.id}`]}
                    onToggleExpand={toggleExpand}
                    onAction={() => handleAiAction(`quadrant-${content.id}`, content.prompt)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Guia;
