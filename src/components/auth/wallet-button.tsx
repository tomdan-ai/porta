"use client";

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { motion } from "framer-motion";

export function WalletButton() {
    const currentAccount = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    if (currentAccount) {
        return (
            <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="py-2 px-3 rounded-lg bg-surface-elevated border border-surface-border flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="font-mono text-sm text-foreground">
                        {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
                    </span>
                </div>
                <motion.button
                    onClick={() => disconnect()}
                    className="py-2 px-3 rounded-lg text-sm text-text-secondary hover:text-foreground hover:bg-surface-elevated transition-all"
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
            connectText="Connect Wallet"
            className="!btn-primary !text-sm !py-2.5 !px-5"
        />
    );
}
