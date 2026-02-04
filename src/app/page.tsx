"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Header } from "@/components/layout/header";
import { MigrationCard } from "@/components/ui/migration-card";
import { GasCalculator } from "@/components/ui/gas-calculator";
import { PROTOCOLS } from "@/lib/protocols/constants";
import { createMigrationBuilder, type MigrationRoute } from "@/lib/transaction-builder/migration-builder";
import { useUserPositions, useMigrationOpportunities, useProtocolsOverview, type ProtocolPosition } from "@/lib/hooks/use-positions";
import { ProtocolOverview } from "@/components/ui/protocol-overview";
import { useProtocolApys } from "@/lib/hooks/use-protocol-apys";

// Loading skeleton for migration cards
function MigrationCardSkeleton() {
  return (
    <div className="card p-5 w-full max-w-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="w-6 h-6 skeleton rounded-full" />
        <div className="w-10 h-10 rounded-xl skeleton" />
        <div className="ml-auto w-20 h-6 skeleton rounded-full" />
      </div>
      <div className="bg-surface-elevated rounded-xl p-4 mb-5">
        <div className="h-4 skeleton rounded mb-3 w-3/4" />
        <div className="h-4 skeleton rounded mb-3 w-1/2" />
        <div className="h-4 skeleton rounded w-2/3" />
      </div>
      <div className="h-12 skeleton rounded-xl" />
    </div>
  );
}

// Empty state when user has no positions
function EmptyState() {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-light flex items-center justify-center">
        <span className="text-4xl">📊</span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No Positions Found</h3>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        You don&apos;t have any positions in Navi or Scallop yet.
        Start by depositing assets to see migration opportunities.
      </p>
      <div className="flex justify-center gap-3">
        <a
          href="https://naviprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Open Navi →
        </a>
        <a
          href="https://scallop.io"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Open Scallop →
        </a>
      </div>
    </motion.div>
  );
}

// Error state
function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-error-light flex items-center justify-center">
        <span className="text-4xl">⚠️</span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Unable to Load Positions</h3>
      <p className="text-text-secondary max-w-md mx-auto">{message}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Real data hooks
  const { data: positions, isLoading: positionsLoading, error: positionsError } = useUserPositions();
  const { data: protocolsOverview, isLoading: overviewLoading } = useProtocolsOverview();
  const { data: apyData } = useProtocolApys();
  const { data: migrationOpportunities } = useMigrationOpportunities();

  const [isAnimating, setIsAnimating] = useState(false);
  const [isMigrating, setIsMigrating] = useState<string | null>(null);

  const handleMigrate = async (opp: any) => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    const positionId = opp.id;
    setIsMigrating(positionId);

    try {
      const route = opp.route as MigrationRoute;

      const builder = createMigrationBuilder(suiClient);
      const tx = await builder.build({
        amount: opp.supplied,
        coin: opp.coin,
        coinType: opp.coinType,
        route,
        senderAddress: account.address,
      });

      await signAndExecute({
        transaction: tx,
      });
    } catch (error) {
      console.error("Migration failed:", error);
      alert(`Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsMigrating(null);
    }
  };

  const getApy = (protocol: string, coin: string): number => {
    if (!apyData) return 0;
    const protocolData = apyData.byProtocol.find(p => p.protocol === protocol);
    const coinData = protocolData?.coins.find(c => c.coin.toUpperCase() === coin.toUpperCase());
    return coinData?.supplyApy ?? 0;
  };

  const getTargetProtocol = (sourceProtocol: string): keyof typeof PROTOCOLS => {
    return sourceProtocol === "NAVI" ? "SCALLOP" : "NAVI";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4 hero-gradient">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className="badge badge-primary">
              ⚡ Powered by Sui
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Move DeFi Positions <span className="gradient-text">Instantly</span>
          </motion.h1>

          <motion.p
            className="text-lg text-text-secondary mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Migrate between protocols in one click. No manual withdrawals, no waiting.
          </motion.p>

          {!account && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="card inline-block p-4">
                <p className="text-sm text-text-secondary">
                  👆 Connect your wallet to get started
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Protocol Overview Section */}
      {account && (
        <section className="py-4 px-4 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <ProtocolOverview
              protocols={protocolsOverview || []}
              isLoading={overviewLoading}
            />
          </div>
        </section>
      )}

      {/* Migration Cards Grid */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-xl font-bold mb-6 text-center text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {account ? "Your Migration Opportunities" : "Connect Wallet to View Positions"}
          </motion.h2>

          {/* Loading State */}
          {account && positionsLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
              {[1, 2, 3].map((i) => (
                <MigrationCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {account && positionsError && (
            <ErrorState message={positionsError.message} />
          )}

          {/* Empty State */}
          {account && !positionsLoading && !positionsError && positions?.length === 0 && (
            <EmptyState />
          )}

          {/* Migration Opportunities Grid */}
          {account && !positionsLoading && migrationOpportunities && migrationOpportunities.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
              {migrationOpportunities.map((opp: any, index: number) => {
                const sourceApy = opp.supplyApy * 100; // Convert to percentage
                const targetApy = opp.targetApy || opp.supplyApy * 100;

                return (
                  <motion.div
                    key={`${opp.id}-${opp.targetProtocol}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <MigrationCard
                      sourceProtocol={PROTOCOLS[opp.protocol as keyof typeof PROTOCOLS]}
                      targetProtocol={PROTOCOLS[opp.targetProtocol as keyof typeof PROTOCOLS]}
                      asset={{
                        symbol: opp.targetCoin || opp.coin,
                        amount: opp.suppliedFormatted,
                        valueUsd: `$${opp.suppliedUsd.toFixed(2)}`,
                      }}
                      sourceApy={sourceApy}
                      targetApy={targetApy}
                      onMigrate={() => handleMigrate(opp)}
                      isLoading={isMigrating === opp.id}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Not Connected State */}
          {!account && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-light flex items-center justify-center">
                <span className="text-4xl">🔗</span>
              </div>
              <p className="text-text-secondary">
                Connect your wallet to see your DeFi positions
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Sui Section */}
      <section className="py-16 px-4 section-alt">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                className="text-2xl font-bold mb-4 text-foreground"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                Why Sui?
              </motion.h2>
              <motion.p
                className="text-text-secondary mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Programmable Transaction Blocks enable atomic, multi-step operations
                in a single transaction.
              </motion.p>
              <motion.ul
                className="space-y-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                {[
                  { icon: "🔗", text: "Atomic execution" },
                  { icon: "⚡", text: "Sub-second finality" },
                  { icon: "💰", text: "Gas under $0.01" },
                  { icon: "🛡️", text: "No intermediate risks" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground">
                    <span className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-sm">
                      {feature.icon}
                    </span>
                    {feature.text}
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
      <footer className="py-8 px-4 text-center border-t border-surface-border">
        <p className="text-sm text-text-muted">
          Built for Sui · Powered by <span className="text-primary font-medium">PTBs</span>
        </p>
      </footer>
    </div>
  );
}
