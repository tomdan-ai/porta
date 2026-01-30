"use client";

import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { createNaviClient } from "../protocols/navi-client";
import { createScallopClient } from "../protocols/scallop-client";
import { createMagmaClient } from "../protocols/magma-client";
import { PROTOCOLS, type ProtocolKey } from "../protocols/constants";

/**
 * APY data for a specific coin across protocols
 */
export interface CoinApyData {
    coin: string;
    protocols: {
        protocol: ProtocolKey;
        protocolName: string;
        protocolColor: string;
        supplyApy: number;
        borrowApy: number;
    }[];
    bestSupplyProtocol: ProtocolKey | null;
    bestBorrowProtocol: ProtocolKey | null;
}

/**
 * Protocol-specific APY data
 */
export interface ProtocolApyData {
    protocol: ProtocolKey;
    protocolName: string;
    coins: {
        coin: string;
        supplyApy: number;
        borrowApy: number;
    }[];
}

/**
 * Fetch live APY data from all supported protocols
 */
export function useProtocolApys() {
    const suiClient = useSuiClient();

    return useQuery({
        queryKey: ["protocol-apys"],
        queryFn: async (): Promise<{
            byProtocol: ProtocolApyData[];
            byCoin: CoinApyData[];
        }> => {
            // Create protocol clients
            const naviClient = createNaviClient(suiClient, "mainnet");
            const scallopClient = createScallopClient(suiClient);
            const magmaClient = createMagmaClient(suiClient);

            // Fetch APYs from all protocols in parallel
            const [naviApys, scallopApys, magmaApys] = await Promise.allSettled([
                naviClient.getApys(),
                scallopClient.getApys(),
                magmaClient.getApys(),
            ]);

            // Build protocol-specific data
            const byProtocol: ProtocolApyData[] = [];

            if (naviApys.status === "fulfilled") {
                byProtocol.push({
                    protocol: "NAVI",
                    protocolName: PROTOCOLS.NAVI.name,
                    coins: Object.entries(naviApys.value).map(([coin, data]) => ({
                        coin,
                        supplyApy: data.supplyApy * 100, // Convert to percentage
                        borrowApy: data.borrowApy * 100,
                    })),
                });
            }

            if (scallopApys.status === "fulfilled") {
                byProtocol.push({
                    protocol: "SCALLOP",
                    protocolName: PROTOCOLS.SCALLOP.name,
                    coins: Object.entries(scallopApys.value).map(([coin, data]) => ({
                        coin,
                        supplyApy: data.supplyApy * 100,
                        borrowApy: data.borrowApy * 100,
                    })),
                });
            }

            if (magmaApys.status === "fulfilled") {
                byProtocol.push({
                    protocol: "MAGMA",
                    protocolName: PROTOCOLS.MAGMA.name,
                    coins: Object.entries(magmaApys.value).map(([coin, data]) => ({
                        coin,
                        supplyApy: data.supplyApy * 100,
                        borrowApy: data.borrowApy * 100,
                    })),
                });
            }

            // Build coin-specific data with best protocol comparison
            const coinMap = new Map<string, CoinApyData>();

            for (const protocolData of byProtocol) {
                for (const coinData of protocolData.coins) {
                    if (!coinMap.has(coinData.coin)) {
                        coinMap.set(coinData.coin, {
                            coin: coinData.coin,
                            protocols: [],
                            bestSupplyProtocol: null,
                            bestBorrowProtocol: null,
                        });
                    }

                    const entry = coinMap.get(coinData.coin)!;
                    entry.protocols.push({
                        protocol: protocolData.protocol,
                        protocolName: protocolData.protocolName,
                        protocolColor: PROTOCOLS[protocolData.protocol].color,
                        supplyApy: coinData.supplyApy,
                        borrowApy: coinData.borrowApy,
                    });
                }
            }

            // Calculate best protocols for each coin
            const byCoin: CoinApyData[] = [];
            for (const [, data] of coinMap) {
                // Find best supply APY (highest)
                let bestSupply = { protocol: null as ProtocolKey | null, apy: -1 };
                for (const p of data.protocols) {
                    if (p.supplyApy > bestSupply.apy) {
                        bestSupply = { protocol: p.protocol, apy: p.supplyApy };
                    }
                }
                data.bestSupplyProtocol = bestSupply.protocol;

                // Find best borrow APY (lowest)
                let bestBorrow = { protocol: null as ProtocolKey | null, apy: Infinity };
                for (const p of data.protocols) {
                    if (p.borrowApy < bestBorrow.apy && p.borrowApy > 0) {
                        bestBorrow = { protocol: p.protocol, apy: p.borrowApy };
                    }
                }
                data.bestBorrowProtocol = bestBorrow.protocol;

                byCoin.push(data);
            }

            // Sort coins alphabetically
            byCoin.sort((a, b) => a.coin.localeCompare(b.coin));

            return { byProtocol, byCoin };
        },
        staleTime: 60_000, // Refresh every 60 seconds
        refetchOnWindowFocus: true,
    });
}

/**
 * Get APY for a specific coin across protocols
 */
export function useCoinApy(coin: string) {
    const { data, isLoading, error } = useProtocolApys();

    const coinData = data?.byCoin.find(c => c.coin.toUpperCase() === coin.toUpperCase());

    return {
        data: coinData,
        isLoading,
        error,
    };
}

/**
 * Get APYs for a specific protocol
 */
export function useProtocolApy(protocol: ProtocolKey) {
    const { data, isLoading, error } = useProtocolApys();

    const protocolData = data?.byProtocol.find(p => p.protocol === protocol);

    return {
        data: protocolData,
        isLoading,
        error,
    };
}

/**
 * Find the best APY for a coin and migration opportunity
 */
export function useBestApy(coin: string, currentProtocol: ProtocolKey) {
    const { data, isLoading, error } = useCoinApy(coin);

    if (!data) {
        return { bestApy: null, shouldMigrate: false, targetProtocol: null, isLoading, error };
    }

    const currentApy = data.protocols.find(p => p.protocol === currentProtocol)?.supplyApy ?? 0;
    const bestProtocol = data.protocols.reduce((best, current) => {
        if (current.supplyApy > best.supplyApy) return current;
        return best;
    }, data.protocols[0]);

    const shouldMigrate = bestProtocol.protocol !== currentProtocol && bestProtocol.supplyApy > currentApy * 1.1; // 10% improvement threshold

    return {
        currentApy,
        bestApy: bestProtocol.supplyApy,
        shouldMigrate,
        targetProtocol: shouldMigrate ? bestProtocol.protocol : null,
        targetProtocolName: shouldMigrate ? bestProtocol.protocolName : null,
        apyImprovement: bestProtocol.supplyApy - currentApy,
        isLoading,
        error,
    };
}
