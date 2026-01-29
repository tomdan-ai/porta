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
            className="card p-5 w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Migration Route */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    {/* Source */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: sourceProtocol.color }}
                    >
                        {sourceProtocol.name.charAt(0)}
                    </div>

                    {/* Arrow */}
                    <motion.div
                        animate={{ x: isHovered ? [0, 4, 0] : 0 }}
                        transition={{ repeat: isHovered ? Infinity : 0, duration: 0.8 }}
                        className="text-primary text-lg px-1"
                    >
                        →
                    </motion.div>

                    {/* Target */}
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm"
                        style={{ backgroundColor: targetProtocol.color }}
                    >
                        {targetProtocol.name.charAt(0)}
                    </div>
                </div>

                {/* APY Badge */}
                <span className={`badge ${isPositiveGain ? "badge-success" : "badge-error"}`}>
                    {isPositiveGain ? "+" : ""}{apyDifference.toFixed(1)}% APY
                </span>
            </div>

            {/* Asset Info */}
            <div className="bg-surface-elevated rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Asset</span>
                    <span className="font-semibold text-foreground">{asset.symbol}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-muted">Amount</span>
                    <span className="font-mono text-foreground">{asset.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Value</span>
                    <span className="font-semibold text-primary">{asset.valueUsd}</span>
                </div>
            </div>

            {/* APY Comparison */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="text-center p-3 bg-surface-elevated rounded-xl">
                    <p className="text-xs text-text-muted mb-1">{sourceProtocol.name}</p>
                    <p className="text-lg font-bold" style={{ color: sourceProtocol.color }}>
                        {sourceApy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-muted">Current</p>
                </div>
                <div className="text-center p-3 bg-surface-elevated rounded-xl">
                    <p className="text-xs text-text-muted mb-1">{targetProtocol.name}</p>
                    <p className="text-lg font-bold" style={{ color: targetProtocol.color }}>
                        {targetApy.toFixed(1)}%
                    </p>
                    <p className="text-xs text-text-muted">Target</p>
                </div>
            </div>

            {/* Migrate Button */}
            <motion.button
                onClick={onMigrate}
                disabled={isLoading}
                className="btn-primary w-full"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
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
                    `Migrate to ${targetProtocol.name}`
                )}
            </motion.button>
        </motion.div>
    );
}
