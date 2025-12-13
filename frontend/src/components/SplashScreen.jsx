import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-brand-black)] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-40 blur-3xl pointer-events-none animate-aurora"
                style={{
                    backgroundSize: "200% 200%",
                    backgroundImage: `
                 radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.4), transparent 25%), 
                 radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.4), transparent 25%), 
                 radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.2), transparent 50%)
               `
                }}
            ></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none"></div>

            {/* Logo Container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Animated Logo Symbol */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-8 relative"
                >
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <motion.path
                                d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                            <motion.path
                                d="M3 6h18"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                            />
                            <motion.path
                                d="M16 10a4 4 0 0 1-8 0"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.8 }}
                            />
                        </svg>
                    </div>
                    {/* Glow Ring */}
                    <motion.div
                        className="absolute -inset-4 rounded-full border border-white/10"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>

                {/* Application Title */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-3"
                >
                    ShopSense
                </motion.h1>

                {/* Description */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="text-[var(--color-brand-text-muted)] text-sm tracking-widest uppercase font-medium"
                >
                    Smart Inventory & Billing
                </motion.p>
            </div>

            {/* Loading Bar */}
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                transition={{ delay: 1, duration: 1.5 }}
                className="absolute bottom-20 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            />
        </div>
    );
};

export default SplashScreen;
