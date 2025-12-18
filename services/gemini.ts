import { GoogleGenAI } from "@google/genai";

export const generateGeminiContent = async (prompt: string, userApiKey?: string): Promise<string> => {
  // Priorizar la clave del usuario, luego la del entorno
  const keyToUse = userApiKey || process.env.API_KEY || '';

  if (!keyToUse) {
    throw new Error("API_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export interface SmartSuggestion {
    symbol: string;
    reason: string;
}

export const getSmartRecommendation = async (
  command: 'BEST' | 'SHORT' | 'MID' | 'RISK', 
  marketType: 'CRYPTO' | 'STOCK',
  apiKey: string,
  excludedSymbols: string[] = []
): Promise<SmartSuggestion | null> => {
    if (!apiKey) throw new Error("API_MISSING");

    const context = marketType === 'CRYPTO' ? 'Criptomonedas (Binance)' : 'Mercado de Valores (Yahoo Finance)';
    
    let criteria = "";
    switch (command) {
        case 'BEST': criteria = "El activo líder con la tendencia alcista más saludable, fuerte y definida buscando nuevos máximos."; break;
        case 'SHORT': criteria = "El activo con mayor aceleración alcista (Momentum) rompiendo resistencias AHORA MISMO."; break;
        case 'MID': criteria = "Tendencia estructural alcista perfecta con proyección directa a romper máximos históricos."; break;
        case 'RISK': criteria = "Activo volátil en plena explosión de precio vertical (Parabólico/Breakout agresivo)."; break;
    }

    const excludedText = excludedSymbols.length > 0
        ? `IMPORTANTE: NO recomiendes ninguno de estos activos (ya están en cartera): ${excludedSymbols.join(', ')}.`
        : "";

    const prompt = `
      Actúa como un experto broker financiero algorítmico especializado en "Momentum Trading" y "Breakouts".
      Mercado: ${context}.
      
      DIRECTRIZ OBLIGATORIA:
      Propon SIEMPRE valores en ALZA PRONUNCIADA y que se dirijan a MÁXIMOS (All-Time Highs o 52-week Highs).
      Descarta activos en rango, bajistas, o "baratos". Queremos fuerza relativa y velocidad.
      
      TAREA: Recomienda UN ÚNICO Ticker/Símbolo para este criterio: "${criteria}".
      ${excludedText}
      
      REGLAS ESTRICTAS DE FORMATO (JSON):
      Debes responder ÚNICAMENTE con un objeto JSON válido. No uses bloques de código markdown.
      Estructura:
      {
        "symbol": "TICKER",
        "reason": "Explicación técnica breve (máx 40 palabras) destacando la ruptura de máximos o la fuerza de la tendencia."
      }
    `;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        
        const text = response.text?.trim() || "";
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        
        return {
            symbol: data.symbol.toUpperCase().replace(/\./g, '').trim(),
            reason: data.reason
        };
    } catch (error) {
        console.error("Smart Search Error", error);
        return null;
    }
};