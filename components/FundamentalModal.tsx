import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Key } from 'lucide-react';
import { Asset } from '../types';
import { generateGeminiContent } from '../services/gemini';

interface Props {
  asset: Asset;
  apiKey: string;
  onClose: () => void;
}

const FundamentalModal: React.FC<Props> = ({ asset, apiKey, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'NONE' | 'KEY' | 'CONN'>('NONE');

  useEffect(() => {
    const fetchFundamental = async () => {
      if (!apiKey) {
        setErrorType('KEY');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorType('NONE');

      try {
        const prompt = `
          Actúa como analista financiero senior.
          Genera un informe fundamental "Forensic Style" para: ${asset.name} (${asset.symbol}).
          
          OBJETIVO: Explicar naturaleza y utilidad real.
          
          INSTRUCCIÓN DE FORMATO:
          Usa caracteres UNICODE MATEMÁTICOS (Negrita serif, Cursiva) para dar formato profesional SIN usar Markdown.
          Ejemplo: 𝐈𝐃𝐄𝐍𝐓𝐈𝐃𝐀𝐃, 𝑃𝑟𝑜𝑝𝑢𝑒𝑠𝑡𝑎.
          
          ESTRUCTURA:
          𝐈𝐃𝐄𝐍𝐓𝐈𝐃𝐀𝐃 𝐃𝐄𝐋 𝐀𝐂𝐓𝐈𝐕𝐎
          ━━━━━━━━━━━━━━━━━━━━
          • Tipo: [Layer 1 / Token / etc]
          • Consenso: [PoW / PoS / Hashgraph]
          
          𝐏𝐑𝐎𝐏𝐔𝐄𝐒𝐓𝐀 𝐃𝐄 𝐕𝐀𝐋𝐎𝐑
          ━━━━━━━━━━━━━━━━━━
          [Explicación concisa 1-2 frases]
          
          𝐔𝐓𝐈𝐋𝐈𝐃𝐀𝐃 𝐑𝐄𝐀𝐋
          ━━━━━━━━━━━━━
          • [Uso 1]
          • [Uso 2]
          
          (Máx 80 palabras. Español. Sin Emojis).
        `;
        const text = await generateGeminiContent(prompt, apiKey);
        setAnalysis(text);
      } catch (e) { 
        console.error(e);
        if (String(e).includes('API_MISSING') || String(e).includes('key')) {
          setErrorType('KEY');
        } else {
          setErrorType('CONN');
        }
      } finally { 
        setLoading(false); 
      }
    };
    fetchFundamental();
  }, [asset, apiKey]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="text-gray-900" size={24} />
            <div>
                <h3 className="font-black text-gray-900 text-lg leading-none">ANÁLISIS FUNDAMENTAL</h3>
                <p className="text-xs text-gray-400 font-medium mt-1">{asset.name} ({asset.symbol})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={24} /></button>
        </div>
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh]">
           {loading ? (
             <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="animate-spin text-gray-900" size={32}/>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Analizando Activo...</p>
             </div>
           ) : errorType === 'KEY' ? (
             <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <Key size={32} />
                </div>
                <div>
                    <h4 className="font-black text-gray-900">API KEY FALTANTE</h4>
                    <p className="text-xs text-gray-500 mt-2">Configura tu clave de Gemini en el menú de ajustes para ver el análisis fundamental.</p>
                </div>
             </div>
           ) : errorType === 'CONN' ? (
             <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                    <X size={32} />
                </div>
                <div>
                    <h4 className="font-black text-gray-900">ERROR DE CONEXIÓN</h4>
                    <p className="text-xs text-gray-500 mt-2">No se pudo contactar con la IA. Verifica tu conexión a internet o la validez de tu API Key.</p>
                </div>
             </div>
           ) : (
             <div className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-relaxed border border-gray-100 p-4 rounded-lg bg-gray-50/30">{analysis}</div>
           )}
        </div>
      </div>
    </div>
  );
};

export default FundamentalModal;