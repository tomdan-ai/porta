"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WalletButton } from "../auth/wallet-button";

export function Header() {
    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-40"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
        >
            <div className="glass-card mx-4 mt-4 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white text-lg font-bold">P</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Porta</h1>
                            <p className="text-xs text-text-muted -mt-0.5">DeFi Migration</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link
                            href="/"
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-all"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/migrate"
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-all"
                        >
                            Migrate
                        </Link>
                        <Link
                            href="/history"
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-all"
                        >
                            History
                        </Link>
                    </nav>

                    {/* Wallet */}
                    <WalletButton />
                </div>
            </div>
        </motion.header>
    );
}
