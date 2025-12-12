import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoice = () => {
    const [isListening, setIsListening] = useState(false);
    const [text, setText] = useState("");
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false); // Track intended state

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            setError("Web Speech API not supported in this browser.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false; // We use auto-restart instead of native continuous for better compatibility
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Voice Result:", transcript);
            setText(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Voice Error:", event.error);
            if (event.error === 'no-speech') {
                return; // Ignore no-speech errors in continuous loop
            }
            if (event.error !== 'aborted') {
                setError("Voice Error: " + event.error);
            }
        };

        recognition.onend = () => {
            // Check if we should still be listening (simulating continuous mode)
            if (shouldListenRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Restart error:", e);
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
    }, []);

    const start = useCallback(() => {
        setText("");
        shouldListenRef.current = true;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Ignore if already started
            }
        }
    }, []);

    const stop = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return {
        text,
        isListening,
        start,
        stop,
        error,
        supported: 'webkitSpeechRecognition' in window
    };
};
