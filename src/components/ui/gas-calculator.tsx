"use client";

import { motion } from "framer-motion";

interface GasCalculatorProps {
    suiGasCost: number; // in USD
    estimatedGas?: bigint; // in MIST
}

const COMPARISON_DATA = [
    { chain: "Ethereum", cost: 85.0, color: "#627EEA" },
    { chain: "Arbitrum", cost: 2.5, color: "#28A0F0" },
    { chain: "Solana", cost: 0.025, color: "#9945FF" },
    { chain: "Sui", cost: 0.004, color: "#4DA2FF", highlight: true },
];

export function GasCalculator({ suiGasCost = 0.004, estimatedGas }: GasCalculatorProps) {
    const maxCost = Math.max(...COMPARISON_DATA.map(d => d.cost));

    return (
        <motion.div
            className="glass-card p-6 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⛽</span>
                <span>Gas Comparison</span>
            </h3>

            <p className="text-sm text-foreground/60 mb-6">
                See how much you save on Sui compared to other chains
            </p>

            <div className="space-y-4">
                {COMPARISON_DATA.map((chain, index) => (
                    <motion.div
                        key={chain.chain}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${chain.highlight ? "font-bold text-secondary" : "text-foreground/80"}`}>
                                {chain.chain}
                                {chain.highlight && " ✨"}
                            </span>
                            <span className={`font-mono text-sm ${chain.highlight ? "text-secondary" : ""}`}>
                                ${chain.chain === "Sui" ? suiGasCost.toFixed(4) : chain.cost.toFixed(chain.cost < 1 ? 3 : 2)}
                            </span>
                        </div>
                        <div className="h-2 bg-surface rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: chain.color }}
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${(chain.cost / maxCost) * 100}%`,
                                }}
                                transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Savings Highlight */}
            <motion.div
                className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-3xl">💰</span>
                    <div>
                        <p className="text-sm text-foreground/60">You save</p>
                        <p className="text-2xl font-bold text-success">
                            ${(85 - suiGasCost).toFixed(2)}
                        </p>
                        <p className="text-xs text-foreground/40">vs Ethereum</p>
                    </div>
                </div>
            </motion.div>

            {estimatedGas && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-foreground/40">
                        Estimated gas: {(Number(estimatedGas) / 1_000_000_000).toFixed(6)} SUI
                    </p>
                </div>
            )}
        </motion.div>
    );
}
