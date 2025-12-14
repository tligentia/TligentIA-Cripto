import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import { Asset } from '../types';
import { generateGeminiContent } from '../services/gemini';

interface Props {
  asset: Asset;
  onClose: () => void;
}

const FundamentalModal: React.FC<Props> = ({ asset, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundamental = async () => {
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
        const text = await generateGeminiContent(prompt);
        setAnalysis(text);
      } catch (e) { 
        setAnalysis("Error de conexión."); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchFundamental();
  }, [asset]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden border border-indigo-200">
        <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-600" size={24} />
            <div>
                <h3 className="font-black text-indigo-900 text-lg leading-none">ANÁLISIS FUNDAMENTAL</h3>
                <p className="text-xs text-indigo-500 font-medium mt-1">{asset.name} ({asset.symbol})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400"><X size={24} /></button>
        </div>
        <div className="p-6 bg-white overflow-y-auto max-h-[70vh]">
           {loading ? 
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" size={32}/></div> : 
             <div className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-relaxed">{analysis}</div>
           }
        </div>
      </div>
    </div>
  );
};

export default FundamentalModal;