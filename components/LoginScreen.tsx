import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const gridChars = useMemo(() => {
    const required = ['7', '8', 'S', 'T', 'A', 'R'];
    const filler = 'BCDEFGHIJKMNOPQUVWXYZ01234569'.split('');
    let combined = [...required];
    while (combined.length < 16) {
      const randomFiller = filler[Math.floor(Math.random() * filler.length)];
      if (!combined.includes(randomFiller)) combined.push(randomFiller);
    }
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined;
  }, []);

  const handleInput = useCallback((char: string) => {
    if (error) return;
    if (pin.length < 4) setPin(prev => prev + char.toUpperCase());
  }, [pin.length, error]);

  const handleBackspace = useCallback(() => setPin(prev => prev.slice(0, -1)), []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (error) { setPin(''); setError(false); return; }
    if (event.key === 'Backspace') handleBackspace();
    else if (/^[a-zA-Z0-9]$/.test(event.key) && pin.length < 4) handleInput(event.key);
  }, [pin.length, error, handleInput, handleBackspace]);

  useEffect(() => {
    if (pin.length === 4) {
      const validPins = ['7887', 'STAR'];
      if (validPins.includes(pin.toUpperCase())) onLoginSuccess();
      else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 800);
      }
    }
  }, [pin, onLoginSuccess]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-white z-[999] flex flex-col justify-center items-center font-sans overflow-hidden" aria-modal="true" role="dialog">
      <div className={`max-w-xs w-full px-6 flex flex-col items-center transform transition-transform ${error ? 'animate-shake' : ''}`}>
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-red-700 mb-4">
             <span className="text-red-700 font-black text-xl">GO</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Acceso Restringido</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Terminal v25.12T</p>
        </div>

        <div className="flex justify-center gap-3 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-14 flex items-center justify-center text-3xl font-black border-b-4 transition-all duration-200 
                ${error ? 'border-red-600 text-red-600' : (pin[i] ? 'border-gray-900 text-gray-900' : 'border-gray-100 text-gray-200')}`}
            >
              {pin[i] ? '*' : '•'}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 w-full mb-8">
          {gridChars.map((char, idx) => (
            <button
              key={idx}
              onClick={() => handleInput(char)}
              disabled={pin.length >= 4 || error}
              className="aspect-square flex items-center justify-center text-3xl font-black text-gray-900 border border-gray-100 rounded-2xl hover:bg-gray-900 hover:text-white hover:border-gray-900 active:scale-95 transition-all disabled:opacity-30"
            >
              {char}
            </button>
          ))}
        </div>

        <div className="w-full flex justify-between items-center px-2">
            <button onClick={handleBackspace} className="text-[10px] font-bold text-gray-400 hover:text-red-700 uppercase tracking-wider transition-colors">Borrar</button>
            <span className="text-[10px] font-bold text-gray-300 font-mono tracking-tighter uppercase">Sistema Protegido</span>
        </div>
      </div>
      <style>{`
        @keyframes shake { 
          0%, 100% { transform: translateX(0); } 
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 
          20%, 40%, 60%, 80% { transform: translateX(6px); } 
        } 
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}