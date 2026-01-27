"use client";

import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { PROTOCOLS } from "../protocols/constants";

export interface ProtocolPosition {
    protocol: keyof typeof PROTOCOLS;
    asset: {
        symbol: string;
        coinType: string;
        amount: string;
        amountRaw: bigint;
        decimals: number;
    };
    apy: number;
    valueUsd: string;
}

/**
 * Fetch user's positions across supported protocols
 */
export function useUserPositions() {
    const client = useSuiClient();
    const account = useCurrentAccount();

    return useQuery({
        queryKey: ["user-positions", account?.address],
        queryFn: async (): Promise<ProtocolPosition[]> => {
            if (!account?.address) return [];

            // Fetch all owned objects
            const objects = await client.getOwnedObjects({
                owner: account.address,
                options: {
                    showContent: true,
                    showType: true,
                },
            });

            const positions: ProtocolPosition[] = [];

            // Parse objects to find protocol-specific position tokens
            for (const obj of objects.data) {
                const type = obj.data?.type;
                if (!type) continue;

                // Check for Navi receipt tokens (simplified detection)
                if (type.includes("navi") || type.includes("lending")) {
                    // In real implementation, decode the object content
                    // For now, create mock position
                    positions.push({
                        protocol: "NAVI",
                        asset: {
                            symbol: "SUI",
                            coinType: "0x2::sui::SUI",
                            amount: "100.00",
                            amountRaw: 100_000_000_000n,
                            decimals: 9,
                        },
                        apy: 2.5,
                        valueUsd: "$120.00",
                    });
                }

                // Check for Scallop market coins
                if (type.includes("scallop") || type.includes("sCoin")) {
                    positions.push({
                        protocol: "SCALLOP",
                        asset: {
                            symbol: "USDC",
                            coinType: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
                            amount: "500.00",
                            amountRaw: 500_000_000n,
                            decimals: 6,
                        },
                        apy: 3.8,
                        valueUsd: "$500.00",
                    });
                }
            }

            return positions;
        },
        enabled: !!account?.address,
        staleTime: 30_000, // Refresh every 30 seconds
    });
}

/**
 * Hook to get target protocol options with APY data
 */
export function useTargetProtocols(sourceProtocol: keyof typeof PROTOCOLS) {
    return useQuery({
        queryKey: ["target-protocols", sourceProtocol],
        queryFn: async () => {
            // In real implementation, fetch live APY data from protocols
            const targets = [];

            if (sourceProtocol === "NAVI") {
                targets.push(
                    { protocol: "SCALLOP" as const, apy: 3.8 },
                    { protocol: "MAGMA" as const, apy: 15.0 },
                );
            } else if (sourceProtocol === "SCALLOP") {
                targets.push(
                    { protocol: "NAVI" as const, apy: 2.5 },
                    { protocol: "MAGMA" as const, apy: 15.0 },
                );
            }

            return targets.map(t => ({
                ...PROTOCOLS[t.protocol],
                key: t.protocol,
                apy: t.apy,
            }));
        },
        staleTime: 60_000,
    });
}
