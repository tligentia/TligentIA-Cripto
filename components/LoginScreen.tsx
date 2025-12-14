import React, { useState, useEffect, useCallback } from 'react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (error) {
        // Clear pin on next keypress after an error
        setPin('');
        setError(false);
    }

    if (event.key === 'Backspace') {
      setPin(prevPin => prevPin.slice(0, -1));
    } else if (/^[a-zA-Z0-9]$/.test(event.key) && pin.length < 4) {
      setPin(prevPin => prevPin + event.key);
    }
  }, [pin.length, error]);

  useEffect(() => {
    if (pin.length === 4) {
      const validPins = ['7887', 'star', 'STAR'];
      if (validPins.includes(pin)) {
        onLoginSuccess();
      } else {
        setError(true);
        // Let the shake animation play, then clear
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
      }
    }
  }, [pin, onLoginSuccess]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const pinBoxes = Array.from({ length: 4 }).map((_, i) => (
    <div
      key={i}
      className={`w-14 h-16 flex items-center justify-center text-4xl font-bold border-2 rounded-lg transition-colors duration-200 ${error ? 'border-red-500 text-red-500' : (pin[i] ? 'border-gray-700 text-gray-900' : 'border-gray-300')}`}
    >
      {pin[i] ? '*' : ''}
    </div>
  ));

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 z-[999] flex justify-center items-center backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className={`p-8 bg-white rounded-xl shadow-2xl text-center transform transition-transform border border-gray-200 ${error ? 'animate-shake' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2" id="login-title">⭐ Acceso Requerido</h2>
        <p className="text-gray-500 mb-6" id="login-description">Por favor, introduce tu PIN de 4 dígitos.</p>
        <div className="flex justify-center gap-4 mb-6" aria-labelledby="login-title">
          {pinBoxes}
        </div>
        <p className="text-xs text-gray-400">Introduce el PIN para continuar.</p>
      </div>
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } } 
        .animate-shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}