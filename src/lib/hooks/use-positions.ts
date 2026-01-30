"use client";

import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { createNaviClient, type NaviPosition } from "../protocols/navi-client";
import { createScallopClient, type ScallopPosition } from "../protocols/scallop-client";
import { createMagmaClient, type MagmaPosition } from "../protocols/magma-client";
import { PROTOCOLS, type ProtocolKey } from "../protocols/constants";
import { useProtocolApys } from "./use-protocol-apys";

/**
 * Unified position interface for cross-protocol display
 */
export interface ProtocolPosition {
    id: string;
    protocol: ProtocolKey;
    protocolName: string;
    protocolColor: string;
    protocolLogo: string;
    coin: string;
    coinType: string;
    supplied: bigint;
    suppliedFormatted: string;
    suppliedUsd: number;
    borrowed: bigint;
    borrowedFormatted: string;
    borrowedUsd: number;
    supplyApy: number;
    borrowApy: number;
    decimals: number;
    netValue: number;
}

/**
 * Format a bigint amount to a human-readable string
 */
function formatAmount(amount: bigint, decimals: number): string {
    const value = Number(amount) / Math.pow(10, decimals);
    if (value === 0) return "0.00";
    if (value < 1e-9) return "0.00"; // Avoid scientific notation for tiny amounts
    if (value < 0.01) return "<0.01";
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals > 6 ? 4 : 2,
    });
}

/**
 * Convert Navi position to unified format
 */
function naviToUnified(position: NaviPosition): ProtocolPosition {
    return {
        id: `navi-${position.coin}`,
        protocol: "NAVI",
        protocolName: PROTOCOLS.NAVI.name,
        protocolColor: PROTOCOLS.NAVI.color,
        protocolLogo: PROTOCOLS.NAVI.logo,
        coin: position.coin,
        coinType: position.coinType,
        supplied: position.supplied,
        suppliedFormatted: formatAmount(position.supplied, position.decimals),
        suppliedUsd: position.suppliedUsd,
        borrowed: position.borrowed,
        borrowedFormatted: formatAmount(position.borrowed, position.decimals),
        borrowedUsd: position.borrowedUsd,
        supplyApy: position.supplyApy,
        borrowApy: position.borrowApy,
        decimals: position.decimals,
        netValue: position.suppliedUsd - position.borrowedUsd,
    };
}

/**
 * Convert Scallop position to unified format
 */
function scallopToUnified(position: ScallopPosition): ProtocolPosition {
    return {
        id: `scallop-${position.coin}`,
        protocol: "SCALLOP",
        protocolName: PROTOCOLS.SCALLOP.name,
        protocolColor: PROTOCOLS.SCALLOP.color,
        protocolLogo: PROTOCOLS.SCALLOP.logo,
        coin: position.coin,
        coinType: position.coinType,
        supplied: position.supplied,
        suppliedFormatted: formatAmount(position.supplied, position.decimals),
        suppliedUsd: position.suppliedUsd,
        borrowed: position.borrowed,
        borrowedFormatted: formatAmount(position.borrowed, position.decimals),
        borrowedUsd: position.borrowedUsd,
        supplyApy: position.supplyApy,
        borrowApy: position.borrowApy,
        decimals: position.decimals,
        netValue: position.suppliedUsd - position.borrowedUsd,
    };
}

/**
 * Convert Magma position to unified format
 */
function magmaToUnified(position: MagmaPosition): ProtocolPosition {
    return {
        id: `magma-${position.positionId}`,
        protocol: "MAGMA",
        protocolName: PROTOCOLS.MAGMA.name,
        protocolColor: PROTOCOLS.MAGMA.color,
        protocolLogo: PROTOCOLS.MAGMA.logo,
        coin: position.coin,
        coinType: position.coinType,
        supplied: position.supplied,
        suppliedFormatted: formatAmount(position.supplied, position.decimals),
        suppliedUsd: position.suppliedUsd,
        borrowed: position.borrowed,
        borrowedFormatted: formatAmount(position.borrowed, position.decimals),
        borrowedUsd: position.borrowedUsd,
        supplyApy: position.supplyApy,
        borrowApy: position.borrowApy,
        decimals: position.decimals,
        netValue: position.suppliedUsd - position.borrowedUsd,
    };
}

/**
 * Fetch user's positions across all supported protocols
 * Returns unified position data from Navi, Scallop, and Magma
 */
export function useUserPositions() {
    const suiClient = useSuiClient();
    const account = useCurrentAccount();

    return useQuery({
        queryKey: ["user-positions", account?.address],
        queryFn: async (): Promise<ProtocolPosition[]> => {
            if (!account?.address) return [];

            const positions: ProtocolPosition[] = [];

            // Create protocol clients
            const naviClient = createNaviClient(suiClient, "mainnet");
            const scallopClient = createScallopClient(suiClient);
            const magmaClient = createMagmaClient(suiClient);

            // Fetch positions from all protocols in parallel
            const [naviPositions, scallopPositions, magmaPositions] = await Promise.allSettled([
                naviClient.getUserPositions(account.address),
                scallopClient.getUserPositions(account.address),
                magmaClient.getUserPositions(account.address),
            ]);

            // Process Navi positions
            if (naviPositions.status === "fulfilled") {
                for (const pos of naviPositions.value) {
                    if (pos.supplied > 0n || pos.borrowed > 0n) {
                        positions.push(naviToUnified(pos));
                    }
                }
            } else {
                console.warn("Failed to fetch Navi positions:", naviPositions.reason);
            }

            // Process Scallop positions
            if (scallopPositions.status === "fulfilled") {
                for (const pos of scallopPositions.value) {
                    if (pos.supplied > 0n || pos.borrowed > 0n) {
                        positions.push(scallopToUnified(pos));
                    }
                }
            } else {
                console.warn("Failed to fetch Scallop positions:", scallopPositions.reason);
            }

            // Process Magma positions
            if (magmaPositions.status === "fulfilled") {
                for (const pos of magmaPositions.value) {
                    if (pos.supplied > 0n) {
                        positions.push(magmaToUnified(pos));
                    }
                }
            } else {
                console.warn("Failed to fetch Magma positions:", magmaPositions.reason);
            }

            // Sort by USD value (highest first)
            positions.sort((a, b) => b.netValue - a.netValue);

            return positions;
        },
        enabled: !!account?.address,
        staleTime: 30_000, // Refresh every 30 seconds
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook to get positions for a specific protocol
 */
export function useProtocolPositions(protocol: ProtocolKey) {
    const { data: allPositions, ...rest } = useUserPositions();

    return {
        ...rest,
        data: allPositions?.filter(p => p.protocol === protocol) ?? [],
    };
}

/**
 * Hook to calculate total portfolio value
 */
export function useTotalPortfolioValue() {
    const { data: positions, isLoading, error } = useUserPositions();

    const totals = positions?.reduce(
        (acc, pos) => ({
            totalSupplied: acc.totalSupplied + pos.suppliedUsd,
            totalBorrowed: acc.totalBorrowed + pos.borrowedUsd,
            netValue: acc.netValue + pos.netValue,
        }),
        { totalSupplied: 0, totalBorrowed: 0, netValue: 0 }
    ) ?? { totalSupplied: 0, totalBorrowed: 0, netValue: 0 };

    return {
        ...totals,
        isLoading,
        error,
    };
}

/**
 * Hook to get migration opportunities
 * Finds positions that could earn higher APY on another protocol or in Magma LP
 */
export function useMigrationOpportunities() {
    const { data: positions, isLoading, error } = useUserPositions();
    const { data: apyData } = useProtocolApys();

    const opportunities = positions
        ?.filter(pos => pos.supplied > 0n)
        .flatMap(pos => {
            const ops: any[] = [];

            // For lending protocols, check both lending-to-lending and lending-to-LP migrations
            if (pos.protocol === "NAVI" || pos.protocol === "SCALLOP") {
                // Option 1: Migrate to the other lending protocol
                const targetLendingProtocol = pos.protocol === "NAVI" ? "SCALLOP" : "NAVI";
                ops.push({
                    ...pos,
                    targetProtocol: targetLendingProtocol,
                    targetProtocolName: PROTOCOLS[targetLendingProtocol].name,
                    targetProtocolColor: PROTOCOLS[targetLendingProtocol].color,
                    route: `${pos.protocol.toLowerCase()}-to-${targetLendingProtocol.toLowerCase()}` as const,
                    apyImprovement: 0, // Would calculate from apyData
                });

                // Option 2: Migrate to Magma LP (if coin is SUI or USDC)
                if (pos.coin === "SUI" || pos.coin === "USDC") {
                    const magmaApy = 15.0; // Placeholder - should get from apyData
                    const currentApyPercent = pos.supplyApy * 100;
                    const apyImprovement = magmaApy - currentApyPercent;

                    // Suggest if there's any improvement
                    if (apyImprovement > 0.1) {
                        ops.push({
                            ...pos,
                            targetProtocol: "MAGMA",
                            targetProtocolName: PROTOCOLS.MAGMA.name,
                            targetProtocolColor: PROTOCOLS.MAGMA.color,
                            targetCoin: "SUI-USDC LP",
                            route: `${pos.protocol.toLowerCase()}-to-magma` as const,
                            apyImprovement,
                            targetApy: magmaApy,
                        });
                    }
                }
            }

            return ops;
        }) ?? [];

    return {
        data: opportunities,
        isLoading,
        error,
    };
}
