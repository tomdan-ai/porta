"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Header } from "@/components/layout/header";
import { MigrationCard } from "@/components/ui/migration-card";
import { GasCalculator } from "@/components/ui/gas-calculator";
import { YetiAnimation } from "@/components/ui/yeti-animation";
import { PROTOCOLS } from "@/lib/protocols/constants";
import { MigrationBuilder } from "@/lib/transaction-builder/migration-builder";

// Demo positions for showcase
const DEMO_POSITIONS = [
  {
    source: PROTOCOLS.NAVI,
    target: PROTOCOLS.SCALLOP,
    asset: { symbol: "SUI", amount: "100.00", valueUsd: "$120.00" },
    sourceApy: 2.5,
    targetApy: 3.8,
    route: "navi-to-scallop" as const,
  },
  {
    source: PROTOCOLS.NAVI,
    target: PROTOCOLS.MAGMA,
    asset: { symbol: "SUI", amount: "250.00", valueUsd: "$300.00" },
    sourceApy: 2.5,
    targetApy: 15.0,
    route: "navi-to-magma" as const,
  },
  {
    source: PROTOCOLS.SCALLOP,
    target: PROTOCOLS.NAVI,
    asset: { symbol: "USDC", amount: "500.00", valueUsd: "$500.00" },
    sourceApy: 3.2,
    targetApy: 4.1,
    route: "scallop-to-navi" as const,
  },
];

export default function Dashboard() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingRoute, setAnimatingRoute] = useState<{ source: string, target: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState<number | null>(null);

  const handleMigrate = async (index: number, route: string) => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsMigrating(index);
    const position = DEMO_POSITIONS[index];

    try {
      // Build the migration transaction
      const builder = new MigrationBuilder();
      const tx = builder.build({
        amount: 100_000_000_000n, // 100 SUI
        coinType: "0x2::sui::SUI",
        route: route as "navi-to-scallop" | "scallop-to-navi" | "navi-to-magma",
      });

      // Show Yeti animation
      setAnimatingRoute({ source: position.source.name, target: position.target.name });
      setIsAnimating(true);

      // Sign and execute
      await signAndExecute({
        transaction: tx,
      });

    } catch (error) {
      console.error("Migration failed:", error);
    } finally {
      setIsMigrating(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Yeti Animation Overlay */}
      <YetiAnimation
        isAnimating={isAnimating}
        sourceProtocol={animatingRoute?.source || ""}
        targetProtocol={animatingRoute?.target || ""}
        onComplete={() => setIsAnimating(false)}
      />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              ✨ Powered by Sui PTBs
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            The <span className="gradient-text">Inter-Protocol Highway</span>
          </motion.h1>

          <motion.p
            className="text-xl text-foreground/60 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Move your DeFi positions between protocols with one click.
            Save gas, save time, maximize yields.
          </motion.p>

          {!account && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-4"
            >
              <div className="glass-card p-4 text-center">
                <p className="text-sm text-foreground/60 mb-2">
                  👆 Connect your wallet to view your positions
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Migration Cards Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-2xl font-bold mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {account ? "Your Migration Opportunities" : "Available Routes"}
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {DEMO_POSITIONS.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MigrationCard
                  sourceProtocol={position.source}
                  targetProtocol={position.target}
                  asset={position.asset}
                  sourceApy={position.sourceApy}
                  targetApy={position.targetApy}
                  onMigrate={() => handleMigrate(index, position.route)}
                  isLoading={isMigrating === index}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gas Calculator Section */}
      <section className="py-16 px-4 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <motion.h2
                className="text-3xl font-bold mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                Why Sui?
              </motion.h2>
              <motion.p
                className="text-foreground/60 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Sui&apos;s Programmable Transaction Blocks let us chain multiple
                protocol interactions into a single atomic transaction.
                One signature, multiple moves.
              </motion.p>
              <motion.ul
                className="space-y-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[
                  "🔗 Atomic execution - all or nothing",
                  "⚡ Sub-second finality",
                  "💰 Gas costs under $0.01",
                  "🛡️ No intermediate state risks",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-foreground/80">
                    {feature}
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GasCalculator suiGasCost={0.004} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-foreground/40 text-sm">
        <p>
          Built with 💜 for the Sui Hackathon | Powered by{" "}
          <span className="gradient-text font-medium">Programmable Transaction Blocks</span>
        </p>
      </footer>
    </div>
  );
}
