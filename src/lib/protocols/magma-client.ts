import { SuiClient } from "@mysten/sui/client";
import { COIN_TYPES, COIN_DECIMALS, PROTOCOLS } from "./constants";

// Lazy import types for MagmaSDK to avoid SSR issues
type MagmaClmmSDK = any;
type Position = any;

export interface MagmaPosition {
    coin: string; // e.g., "SUI-USDC"
    coinType: string; // Combine types if needed or use pool type
    supplied: bigint; // Total value in a "virtual" unit or base coin
    suppliedUsd: number;
    borrowed: bigint; // Always 0 for LP
    borrowedUsd: number;
    supplyApy: number;
    borrowApy: number;
    decimals: number;
    poolId: string;
    positionId: string;
}

export class MagmaClient {
    private sdk: MagmaClmmSDK | null = null;
    private suiClient: SuiClient;
    private initPromise: Promise<void> | null = null;

    constructor(suiClient: SuiClient) {
        this.suiClient = suiClient;
    }

    /**
     * Lazy initialization to avoid loading WASM during SSR
     */
    private async ensureInit(): Promise<void> {
        if (this.sdk) return;

        if (this.initPromise) {
            await this.initPromise;
            return;
        }

        this.initPromise = (async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { initMainnetSDK } = await import("@magmaprotocol/magma-clmm-sdk");
                this.sdk = initMainnetSDK("https://fullnode.mainnet.sui.io:443");
            } catch (error) {
                console.error("Failed to initialize Magma SDK:", error);
                throw error;
            }
        })();

        await this.initPromise;
    }

    /**
     * Fetch all Magma LP positions for a user
     */
    async getUserPositions(address: string): Promise<MagmaPosition[]> {
        try {
            await this.ensureInit();

            if (!this.sdk) {
                console.warn("Magma SDK not initialized");
                return [];
            }

            const positions: Position[] = await this.sdk.Position.getPositionList(address);

            if (!positions || positions.length === 0) {
                return [];
            }

            const magmaPositions: MagmaPosition[] = [];

            for (const pos of positions) {
                // Determine coin symbols from types
                const coinTypeA = pos.coin_type_a;
                const coinTypeB = pos.coin_type_b;

                const symbolA = this.getSymbolFromType(coinTypeA);
                const symbolB = this.getSymbolFromType(coinTypeB);

                const coinSymbol = `${symbolA}-${symbolB}`;

                // For MVP, we'll use placeholder valuations if SDK doesn't provide them directly
                // Real implementation would calculate amountA and amountB from liquidity and ticks

                // Placeholder: Assume 100 USD for demo if they have liquidity
                const liquidityVal = BigInt(pos.liquidity);
                if (liquidityVal === 0n) continue;

                magmaPositions.push({
                    coin: coinSymbol,
                    coinType: `${coinTypeA},${coinTypeB}`,
                    supplied: liquidityVal,
                    suppliedUsd: 100, // Placeholder
                    borrowed: 0n,
                    borrowedUsd: 0,
                    supplyApy: 0.15, // 15% as per PRD
                    borrowApy: 0,
                    decimals: 9, // SUI decimals
                    poolId: pos.pool,
                    positionId: pos.pos_object_id,
                });
            }

            return magmaPositions;
        } catch (error) {
            console.error("Failed to fetch Magma positions:", error);
            return [];
        }
    }

    /**
     * Get APYs for Magma pools
     */
    async getApys(): Promise<Record<string, { supplyApy: number; borrowApy: number }>> {
        // Magma doesn't expose a simple APY endpoint in SDK yet
        // Returning PRD-specified defaults for supported pairs
        return {
            "SUI-USDC": { supplyApy: 0.15, borrowApy: 0 },
            "SUI": { supplyApy: 0.15, borrowApy: 0 }, // For indexing compatibility
        };
    }

    private getSymbolFromType(type: string): string {
        for (const [symbol, coinType] of Object.entries(COIN_TYPES)) {
            if (type.includes(coinType)) return symbol;
        }
        return "UNKNOWN";
    }
}

export function createMagmaClient(suiClient: SuiClient): MagmaClient {
    return new MagmaClient(suiClient);
}
