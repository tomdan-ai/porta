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
            <div className="glass-card mx-4 mt-4 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <motion.span
                            className="text-3xl"
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            🦬
                        </motion.span>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">Porta</h1>
                            <p className="text-xs text-foreground/40">The Great Migration</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/"
                            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/migrate"
                            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                        >
                            Migrate
                        </Link>
                        <Link
                            href="/history"
                            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
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
