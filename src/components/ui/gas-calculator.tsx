"use client";

import { motion } from "framer-motion";

interface GasCalculatorProps {
    suiGasCost: number;
    estimatedGas?: bigint;
}

const COMPARISON_DATA = [
    { chain: "Ethereum", cost: 85.0, color: "#627EEA" },
    { chain: "Arbitrum", cost: 2.5, color: "#28A0F0" },
    { chain: "Solana", cost: 0.025, color: "#9945FF" },
    { chain: "Sui", cost: 0.004, color: "#3b82f6", highlight: true },
];

export function GasCalculator({ suiGasCost = 0.004, estimatedGas }: GasCalculatorProps) {
    const maxCost = Math.max(...COMPARISON_DATA.map(d => d.cost));

    return (
        <div className="card p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-sm">⛽</span>
                Gas Comparison
            </h3>

            <p className="text-sm text-text-secondary mb-6">
                See how much you save on Sui
            </p>

            <div className="space-y-4">
                {COMPARISON_DATA.map((chain, index) => (
                    <motion.div
                        key={chain.chain}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-sm font-medium ${chain.highlight ? "text-primary" : "text-foreground"}`}>
                                {chain.chain}
                                {chain.highlight && " ✨"}
                            </span>
                            <span className={`font-mono text-sm ${chain.highlight ? "text-primary font-bold" : "text-text-secondary"}`}>
                                ${chain.chain === "Sui" ? suiGasCost.toFixed(4) : chain.cost.toFixed(chain.cost < 1 ? 3 : 2)}
                            </span>
                        </div>
                        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: chain.color }}
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.max((chain.cost / maxCost) * 100, 1)}%`,
                                }}
                                transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Savings Highlight */}
            <motion.div
                className="mt-6 p-4 rounded-xl bg-success-light border border-success/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                        <p className="text-xs text-text-muted">You save vs Ethereum</p>
                        <p className="text-xl font-bold text-success">
                            ${(85 - suiGasCost).toFixed(2)}
                        </p>
                    </div>
                </div>
            </motion.div>

            {estimatedGas && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-text-muted">
                        Estimated: {(Number(estimatedGas) / 1_000_000_000).toFixed(6)} SUI
                    </p>
                </div>
            )}
        </div>
    );
}
