"use client";

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { motion } from "framer-motion";

export function WalletButton() {
    const currentAccount = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    if (currentAccount) {
        return (
            <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="glass-card py-2 px-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="font-mono text-sm">
                        {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                    </span>
                </div>
                <motion.button
                    onClick={() => disconnect()}
                    className="py-2 px-4 rounded-xl bg-surface hover:bg-surface-elevated 
                     border border-surface-border transition-colors text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    Disconnect
                </motion.button>
            </motion.div>
        );
    }

    return (
        <ConnectButton
            connectText="🔗 Connect Wallet"
            className="!py-3 !px-6 !rounded-xl !font-bold 
                 !bg-gradient-to-r !from-primary !to-secondary
                 !border-none !text-white hover:!opacity-90
                 !transition-opacity"
        />
    );
}
