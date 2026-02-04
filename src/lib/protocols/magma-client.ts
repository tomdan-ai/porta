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
                try {
                    // Determine coin symbols from types
                    const coinTypeA = pos.coin_type_a;
                    const coinTypeB = pos.coin_type_b;

                    const symbolA = this.getSymbolFromType(coinTypeA);
                    const symbolB = this.getSymbolFromType(coinTypeB);

                    const coinSymbol = `${symbolA}-${symbolB}`;

                    // Fetch live pool data for precise valuation
                    const pool = await this.sdk.Pool.getPool(pos.pool);

                    // Use SDK helper to calculate coin amounts from liquidity and tick range
                    // Note: Magma SDK follows Cetus/UniV3 math patterns
                    // Positional arguments: (liquidity, curSqrtPrice, lowerSqrtPrice, upperSqrtPrice, rowRound)
                    const { coinA, coinB } = await import("@magmaprotocol/magma-clmm-sdk").then(m => {
                        const lowerSqrtPrice = m.TickMath.tickIndexToSqrtPriceX64(pos.tick_lower_index);
                        const upperSqrtPrice = m.TickMath.tickIndexToSqrtPriceX64(pos.tick_upper_index);

                        // SDK strictly expects BN (from bn.js). 
                        // We can access the internal BN constructor via the exported ZERO constant.
                        const BN = (m as any).ZERO.constructor;
                        const liquidityBN = new BN(pos.liquidity.toString());
                        const curSqrtPriceBN = new BN(pool.current_sqrt_price.toString());
                        const lowerSqrtPriceBN = new BN(lowerSqrtPrice.toString());
                        const upperSqrtPriceBN = new BN(upperSqrtPrice.toString());

                        return m.ClmmPoolUtil.getCoinAmountFromLiquidity(
                            liquidityBN,
                            curSqrtPriceBN,
                            lowerSqrtPriceBN,
                            upperSqrtPriceBN,
                            false
                        );
                    });

                    // Get decimals for both coins
                    const decimalsA = COIN_DECIMALS[symbolA] || 9;
                    const decimalsB = COIN_DECIMALS[symbolB] || 9;

                    // Convert to human readable amounts
                    const amountA = Number(coinA) / Math.pow(10, decimalsA);
                    const amountB = Number(coinB) / Math.pow(10, decimalsB);

                    // Manual price calculation: (sqrtPrice / 2^64)^2 * 10^(decimalsA - decimalsB)
                    // pool.current_sqrt_price is a string or number, handle as BigInt for precision if needed
                    const sqrtPriceX64 = BigInt(pool.current_sqrt_price);
                    const Q64 = BigInt(2) ** BigInt(64);

                    // price = (sqrtPriceX64 / Q64)^2
                    const priceRatio = Number(sqrtPriceX64) / Number(Q64);
                    const priceRaw = priceRatio * priceRatio;
                    const currentPriceAB = priceRaw * Math.pow(10, decimalsA - decimalsB);

                    // For USD valuation, we need the USD price of at least one coin
                    let totalUsd = 0;
                    if (symbolB === "USDC" || symbolB === "USDT") {
                        totalUsd = amountB + (amountA * currentPriceAB);
                    } else if (symbolA === "USDC" || symbolA === "USDT") {
                        totalUsd = amountA + (amountB / currentPriceAB);
                    } else {
                        // Fallback: Assume coinB is the quote asset (e.g. SUI) and we'd need another price
                        // For SUI-USDC it works perfectly. For others, we'll use a $2 fallback for SUI if needed.
                        totalUsd = amountB + (amountA * currentPriceAB);
                    }

                    magmaPositions.push({
                        coin: coinSymbol,
                        coinType: `${coinTypeA},${coinTypeB}`,
                        supplied: BigInt(pos.liquidity),
                        suppliedUsd: totalUsd,
                        borrowed: 0n,
                        borrowedUsd: 0,
                        supplyApy: 0.15,
                        borrowApy: 0,
                        decimals: decimalsA,
                        poolId: pos.pool,
                        positionId: pos.pos_object_id,
                    });
                } catch (posError) {
                    console.warn(`Failed to value Magma position ${pos.pos_object_id}:`, posError);
                }
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
