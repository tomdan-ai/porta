"use client";

import { motion } from "framer-motion";
import { PROTOCOLS } from "@/lib/protocols/constants";

interface ProtocolOverviewProps {
    protocols: {
        id: string;
        name: string;
        logo: string;
        color: string;
        isConnected: boolean;
        hasActivePositions: boolean;
        balances: {
            coin: string;
            suppliedFormatted: string;
            borrowedFormatted: string;
        }[];
    }[];
    isLoading: boolean;
}

export function ProtocolOverview({ protocols, isLoading }: ProtocolOverviewProps) {
    // Collect all unique coins across all protocols to create columns
    const allCoins = Array.from(
        new Set(protocols.flatMap((p) => p.balances.map((b) => b.coin)))
    ).sort();

    if (isLoading) {
        return (
            <div className="card p-6 w-full animate-pulse">
                <div className="h-6 bg-surface-elevated rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-surface-elevated rounded w-full"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="card overflow-hidden w-full mb-8"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-elevated/50">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="text-primary text-xl">🌐</span>
                    Protocol Overview
                </h3>
                <div className="flex gap-4 text-xs font-medium uppercase tracking-wider text-text-muted">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        Connected
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-surface-border"></span>
                        Disconnected
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-elevated/30">
                            <th className="p-4 text-sm font-semibold text-text-muted border-b border-surface-border min-w-[180px]">Protocol</th>
                            <th className="p-4 text-sm font-semibold text-text-muted border-b border-surface-border text-center">Status</th>
                            {allCoins.map((coin) => (
                                <th key={coin} className="p-4 text-sm font-semibold text-text-muted border-b border-surface-border text-right whitespace-nowrap">
                                    {coin}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {protocols.map((protocol, idx) => (
                            <motion.tr
                                key={protocol.id}
                                className="hover:bg-primary/5 transition-colors group"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <td className="p-4 border-b border-surface-border">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                            style={{ backgroundColor: protocol.color }}
                                        >
                                            {protocol.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                                {protocol.name}
                                            </p>
                                            <p className="text-[10px] text-text-muted uppercase tracking-tight font-medium">
                                                {protocol.isConnected ? "active sync" : "checked"}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 border-b border-surface-border text-center">
                                    <div className="flex items-center justify-center">
                                        {protocol.isConnected ? (
                                            <span className="badge badge-success !text-[10px] py-0.5 animate-in fade-in zoom-in duration-300">
                                                ✅ Connected
                                            </span>
                                        ) : (
                                            <span className="badge !bg-surface-border !text-text-muted !text-[10px] py-0.5">
                                                ❌ Not Connected
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {allCoins.map((coin) => {
                                    const balance = protocol.balances.find((b) => b.coin === coin);
                                    const isZero = balance?.suppliedFormatted === "0.00";
                                    return (
                                        <td
                                            key={coin}
                                            className={`p-4 border-b border-surface-border text-right font-mono text-sm ${isZero ? "text-text-muted/40" : "text-foreground font-semibold"
                                                }`}
                                        >
                                            {balance ? balance.suppliedFormatted : "-"}
                                        </td>
                                    );
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-3 bg-surface-elevated/20 text-center">
                <p className="text-[10px] text-text-muted italic">
                    Real-time balances fetched from Sui mainnet protocols. Connect your wallet to refresh.
                </p>
            </div>
        </motion.div>
    );
}
