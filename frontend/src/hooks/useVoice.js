import { useState, useRef, useEffect, useCallback } from 'react';

export const useVoice = (sampleRate = 16000) => {
    const [transcriber, setTranscriber] = useState(null);
    const [listening, setListening] = useState(false);
    const listeningRef = useRef(false);
    const [text, setText] = useState("");
    const [partialText, setPartialText] = useState("");
    const [status, setStatus] = useState("Idle");
    const [loadingModel, setLoadingModel] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [language, setLanguage] = useState("en-IN");

    // Use raw audio data capture instead of MediaRecorder to avoid encoding issues
    const audioDataRef = useRef([]);

    // Refs
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);

    // Load Whisper Model
    const loadModel = useCallback(async () => {
        if (transcriber) return transcriber;
        if (loadingModel) return null;

        setLoadingModel(true);
        setStatus("Downloading Model...");

        try {
            // dynamic import to ensure env config is applied to the instance used
            const { pipeline, env } = await import('@xenova/transformers');

            // CRITICAL: Force CDN usage
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            // CDNs for WASM
            env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';

            console.log("Loading Whisper with Env:", env);

            // Using 'Xenova/whisper-tiny.en' for speed 
            const pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');

            setTranscriber(() => pipe);
            setStatus("Voice Ready");
            return pipe;
        } catch (e) {
            console.error("Failed to load Whisper details:", e);
            setStatus(`Model Load Failed: ${e.message}`);
            return null;
        } finally {
            setLoadingModel(false);
        }
    }, [transcriber, loadingModel]);

    // Start Listening
    const startListening = useCallback(async () => {
        let pipe = transcriber;
        if (!pipe) {
            pipe = await loadModel();
            if (!pipe) return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });
            mediaStreamRef.current = stream;
            audioDataRef.current = []; // Reset buffer

            // 1. Audio Visualizer & Capture setup
            const audioContext = new AudioContext();

            console.log("Mic Sample Rate:", audioContext.sampleRate);

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            audioContextRef.current = audioContext;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Buffer size 4096
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            source.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                if (!listeningRef.current) return;

                const input = e.inputBuffer.getChannelData(0);

                // Capture Raw Data
                audioDataRef.current.push(new Float32Array(input));

                // Visualizer
                let sum = 0;
                for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
                const rms = Math.sqrt(sum / input.length);
                setAudioLevel(Math.min(100, Math.round(rms * 400)));
            };

            setListening(true);
            listeningRef.current = true;
            setStatus(`Listening (${audioContext.sampleRate}Hz)...`);
            setText("");

        } catch (e) {
            console.error("Mic Error", e);
            setStatus("Mic Access Denied");
        }
    }, [loadModel, transcriber]);

    const transcribeAudio = async (audioChunks) => {
        if (!transcriber) {
            setStatus("Model not ready. Please wait.");
            return;
        }

        try {
            // Flatten chunks into single Float32Array
            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const rawData = new Float32Array(totalLength);
            let offset = 0;
            for (const chunk of audioChunks) {
                rawData.set(chunk, offset);
                offset += chunk.length;
            }

            console.log("Audio Captured:", rawData.length, "samples");
            if (rawData.length === 0) {
                console.warn("No audio captured");
                setStatus("No Audio Detected");
                return;
            }

            // Run Inference
            const output = await transcriber(rawData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe'
            });

            console.log("Raw Whisper Output:", output);

            const result = output.text || (Array.isArray(output) ? output[0].text : "");
            console.log("Final Transcribed Text:", result);

            if (!result.trim()) {
                setStatus("No speech recognized");
            } else {
                setText(result.trim());
                setStatus("Processing Complete");
            }
        } catch (e) {
            console.error("Transcription Failed", e);
            setStatus(`Error: ${e.message}`);
        }
    };

    const stopListening = useCallback(() => {
        setListening(false);
        listeningRef.current = false;
        setAudioLevel(0);

        // Process captured audio
        if (audioDataRef.current.length > 0) {
            setStatus("Transcribing...");
            // Process in next tick to allow UI update
            setTimeout(() => transcribeAudio(audioDataRef.current), 10);
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (listeningRef.current) stopListening();
        };
    }, []);

    return {
        text,
        partialText,
        listening,
        status,
        loadingModel,
        startListening,
        stopListening,
        loadModel,
        resetText: () => setText(""),
        language,
        setLanguage,
        audioLevel
    };
};
