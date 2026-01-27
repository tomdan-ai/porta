"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface MigrationCardProps {
    sourceProtocol: {
        name: string;
        logo: string;
        color: string;
    };
    targetProtocol: {
        name: string;
        logo: string;
        color: string;
    };
    asset: {
        symbol: string;
        amount: string;
        valueUsd: string;
    };
    sourceApy: number;
    targetApy: number;
    onMigrate: () => void;
    isLoading?: boolean;
}

export function MigrationCard({
    sourceProtocol,
    targetProtocol,
    asset,
    sourceApy,
    targetApy,
    onMigrate,
    isLoading = false,
}: MigrationCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const apyDifference = targetApy - sourceApy;
    const isPositiveGain = apyDifference > 0;

    return (
        <motion.div
            className="glass-card p-6 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: sourceProtocol.color + "30", color: sourceProtocol.color }}
                    >
                        {sourceProtocol.name.charAt(0)}
                    </div>

                    <motion.div
                        animate={{ x: isHovered ? [0, 5, 0] : 0 }}
                        transition={{ repeat: isHovered ? Infinity : 0, duration: 1 }}
                        className="text-2xl text-primary"
                    >
                        →
                    </motion.div>

                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: targetProtocol.color + "30", color: targetProtocol.color }}
                    >
                        {targetProtocol.name.charAt(0)}
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isPositiveGain
                        ? "bg-success/20 text-success"
                        : "bg-error/20 text-error"
                    }`}>
                    {isPositiveGain ? "+" : ""}{apyDifference.toFixed(2)}% APY
                </div>
            </div>

            {/* Asset Info */}
            <div className="bg-surface rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/60">Asset</span>
                    <span className="font-bold">{asset.symbol}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground/60">Amount</span>
                    <span className="font-mono">{asset.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/60">Value</span>
                    <span className="text-secondary">{asset.valueUsd}</span>
                </div>
            </div>

            {/* APY Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-1">{sourceProtocol.name}</p>
                    <p className="text-xl font-bold" style={{ color: sourceProtocol.color }}>
                        {sourceApy.toFixed(2)}%
                    </p>
                    <p className="text-xs text-foreground/40">Current APY</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-foreground/60 mb-1">{targetProtocol.name}</p>
                    <p className="text-xl font-bold" style={{ color: targetProtocol.color }}>
                        {targetApy.toFixed(2)}%
                    </p>
                    <p className="text-xs text-foreground/40">Target APY</p>
                </div>
            </div>

            {/* Migrate Button */}
            <motion.button
                onClick={onMigrate}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl font-bold text-lg
                   bg-gradient-to-r from-primary to-secondary
                   hover:from-primary-hover hover:to-secondary-hover
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            ⟳
                        </motion.span>
                        Migrating...
                    </span>
                ) : (
                    "🦬 Migrate to " + targetProtocol.name
                )}
            </motion.button>
        </motion.div>
    );
}
