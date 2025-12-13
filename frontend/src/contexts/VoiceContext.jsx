import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const VoiceContext = createContext();

export const useVoiceContext = () => useContext(VoiceContext);

export const VoiceProvider = ({ children }) => {
    const isSupported = 'webkitSpeechRecognition' in window;
    const [isListening, setIsListening] = useState(false);
    const [text, setText] = useState("");
    const [error, setError] = useState(isSupported ? null : "Web Speech API not supported.");
    const [language, setLanguage] = useState('en-IN'); // Default English (India)
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);

    // Re-initialize recognition when language changes
    useEffect(() => {
        if (!isSupported) return;

        // Cleanup previous instance
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent restart loop during switch
            recognitionRef.current.stop();
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false; // We handle the loop manually for better stability
        recognition.interimResults = false;
        recognition.lang = language; // Dynamic Language
        console.log("Voice Recognition Initialized with Language:", language);

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log(`Voice Result (${language}):`, transcript);
            setText(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Voice Error:", event.error);
            // 'no-speech' is common when silence. 'language-not-supported' shouldn't happen with standard codes.
            if (event.error === 'no-speech') return;
        };

        recognition.onend = () => {
            // Only restart if we are explicitly supposed to be listening
            if (shouldListenRef.current) {
                try {
                    // Slight delay to prevent CPU thrashing on instant failures
                    setTimeout(() => {
                        if (shouldListenRef.current) recognition.start();
                    }, 100);
                } catch {
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        // If we were listening, restart immediately with new language
        if (shouldListenRef.current) {
            recognition.start();
        }

        return () => {
            if (recognition) {
                recognition.onend = null;
                recognition.stop();
            }
        };
    }, [isSupported, language]);

    const start = useCallback(() => {
        setText("");
        shouldListenRef.current = true;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch { }
        }
    }, []);

    const stop = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const value = {
        text,
        isListening,
        language,      // Expose language
        setLanguage,   // Expose setter
        start,
        stop,
        error,
        supported: isSupported
    };

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};
