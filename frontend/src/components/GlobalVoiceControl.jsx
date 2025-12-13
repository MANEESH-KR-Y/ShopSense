import React from 'react';
import { useVoiceContext } from '../contexts/VoiceContext';

const GlobalVoiceControl = () => {
    const { isListening, start, stop, error } = useVoiceContext();

    const toggleVoice = () => {
        if (isListening) {
            stop();
        } else {
            start();
        }
    };

    return (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
            {/* Error Message if any */}
            {error && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg mb-1">
                    {error}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={toggleVoice}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${isListening
                        ? "bg-red-600 animate-pulse text-white shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                        : "bg-[var(--color-brand-blue)] text-white hover:bg-blue-600"
                    }`}
                title={isListening ? "Stop Voice Assistant" : "Start Voice Assistant"}
            >
                <span className="text-2xl filter drop-shadow-md">
                    {isListening ? '🛑' : '🎙️'}
                </span>
            </button>

            {/* Status Label */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md border ${isListening
                    ? "bg-red-900/80 text-white border-red-500"
                    : "bg-gray-900/80 text-gray-300 border-gray-700"
                }`}>
                {isListening ? "Listening..." : "Tap to Speak"}
            </div>
        </div>
    );
};

export default GlobalVoiceControl;
