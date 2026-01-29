import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        // Hide splash screen after 2.5 seconds
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(() => {
                onComplete?.();
            }, 500); // Wait for exit animation
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"
                >
                    {/* Animated Background Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-white/20 rounded-full"
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: Math.random() * window.innerHeight,
                                    scale: Math.random() * 0.5 + 0.5,
                                }}
                                animate={{
                                    y: [null, Math.random() * -200],
                                    opacity: [0.3, 0],
                                }}
                                transition={{
                                    duration: Math.random() * 2 + 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            />
                        ))}
                    </div>

                    {/* Logo Container */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.2,
                        }}
                        className="relative"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full scale-150" />

                        {/* Icon */}
                        <motion.div
                            animate={{
                                boxShadow: [
                                    "0 0 20px rgba(255,255,255,0.3)",
                                    "0 0 60px rgba(255,255,255,0.5)",
                                    "0 0 20px rgba(255,255,255,0.3)",
                                ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center border border-white/30"
                        >
                            <img
                                src="/icons/icon.svg"
                                alt="Smart Attendance"
                                className="w-20 h-20 md:w-28 md:h-28"
                            />
                        </motion.div>
                    </motion.div>

                    {/* App Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="mt-8 text-center"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                            Smart Attendance
                        </h1>
                        <p className="text-white/80 text-sm md:text-base">
                            Rural School Management System
                        </p>
                    </motion.div>

                    {/* Loading Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-12"
                    >
                        <div className="flex space-x-2">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-3 h-3 bg-white rounded-full"
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Version */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="absolute bottom-8 text-white/50 text-xs"
                    >
                        Version 1.0.0
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;