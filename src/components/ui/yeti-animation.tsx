"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface YetiAnimationProps {
    isAnimating: boolean;
    sourceProtocol: string;
    targetProtocol: string;
    onComplete?: () => void;
}

export function YetiAnimation({
    isAnimating,
    sourceProtocol,
    targetProtocol,
    onComplete,
}: YetiAnimationProps) {
    const [phase, setPhase] = useState<"idle" | "pickup" | "walking" | "dropoff" | "celebrate">("idle");

    useEffect(() => {
        if (isAnimating) {
            // Animation sequence
            setPhase("pickup");
            setTimeout(() => setPhase("walking"), 600);
            setTimeout(() => setPhase("dropoff"), 2000);
            setTimeout(() => {
                setPhase("celebrate");
                onComplete?.();
            }, 2600);
            setTimeout(() => setPhase("idle"), 4000);
        }
    }, [isAnimating, onComplete]);

    return (
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="relative w-[600px] h-[300px]">
                        {/* Source Protocol */}
                        <motion.div
                            className="absolute left-8 top-1/2 -translate-y-1/2 text-center"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="w-20 h-20 rounded-2xl bg-surface-elevated flex items-center justify-center text-4xl mb-2">
                                🏦
                            </div>
                            <span className="text-sm text-foreground/60">{sourceProtocol}</span>
                        </motion.div>

                        {/* Target Protocol */}
                        <motion.div
                            className="absolute right-8 top-1/2 -translate-y-1/2 text-center"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="w-20 h-20 rounded-2xl bg-surface-elevated flex items-center justify-center text-4xl mb-2">
                                💎
                            </div>
                            <span className="text-sm text-foreground/60">{targetProtocol}</span>
                        </motion.div>

                        {/* Yeti Character */}
                        <motion.div
                            className="absolute top-1/2"
                            initial={{ left: "120px", y: "-50%" }}
                            animate={{
                                left: phase === "idle" || phase === "pickup" ? "120px" :
                                    phase === "walking" ? "50%" :
                                        "calc(100% - 180px)",
                                y: "-50%",
                                rotate: phase === "celebrate" ? [0, -10, 10, -10, 0] : 0,
                            }}
                            transition={{
                                duration: phase === "walking" ? 1.4 : 0.3,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="text-6xl select-none">
                                {phase === "celebrate" ? "🎉" : "🦬"}
                            </div>

                            {/* Treasure Chest */}
                            <AnimatePresence>
                                {(phase === "walking" || phase === "dropoff") && (
                                    <motion.div
                                        className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ y: { repeat: Infinity, duration: 0.5 } }}
                                    >
                                        💰
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Progress Trail */}
                        <motion.div
                            className="absolute top-[60%] left-[140px] right-[140px] h-1 bg-surface-border rounded-full overflow-hidden"
                        >
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: phase === "idle" ? "0%" :
                                        phase === "pickup" ? "10%" :
                                            phase === "walking" ? "50%" :
                                                "100%",
                                }}
                                transition={{ duration: 0.6 }}
                            />
                        </motion.div>

                        {/* Status Text */}
                        <motion.p
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-lg font-medium"
                            key={phase}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {phase === "pickup" && "Withdrawing from " + sourceProtocol + "..."}
                            {phase === "walking" && "Migrating your assets..."}
                            {phase === "dropoff" && "Depositing to " + targetProtocol + "..."}
                            {phase === "celebrate" && (
                                <span className="gradient-text">Migration Complete! 🎊</span>
                            )}
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
