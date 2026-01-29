"use client";

import { Scallop, ScallopClient as ScallopSDKClient, ScallopQuery, ScallopBuilder } from "@scallop-io/sui-scallop-sdk";
import { SuiClient } from "@mysten/sui/client";

// Scallop supported coins
export const SCALLOP_COINS = {
    SUI: "sui",
    USDC: "usdc",
    USDT: "usdt",
    WETH: "weth",
    CETUS: "cetus",
    SCA: "sca",
} as const;

export type ScallopCoin = keyof typeof SCALLOP_COINS;
export type ScallopCoinName = typeof SCALLOP_COINS[ScallopCoin];

export interface ScallopPosition {
    coin: ScallopCoin;
    coinType: string;
    supplied: bigint;
    suppliedUsd: number;
    borrowed: bigint;
    borrowedUsd: number;
    supplyApy: number;
    borrowApy: number;
    decimals: number;
}

export interface ScallopPoolInfo {
    coin: ScallopCoin;
    coinType: string;
    supplyApy: number;
    borrowApy: number;
    totalSupply: number;
    totalBorrow: number;
    availableLiquidity: number;
    price: number;
    decimals: number;
}

/**
 * Scallop Protocol Client
 * Wraps the @scallop-io/sui-scallop-sdk for clean integration with Porta
 */
export class ScallopClient {
    private scallop: Scallop | null = null;
    private scallopQuery: ScallopQuery | null = null;
    private scallopBuilder: ScallopBuilder | null = null;
    private suiClient: SuiClient;
    private initialized: boolean = false;

    // Scallop Address ID for mainnet
    private static readonly ADDRESS_ID = "67c44a103fe1b8c454eb9699";

    constructor(suiClient: SuiClient) {
        this.suiClient = suiClient;
    }

    /**
     * Initialize the Scallop SDK instances
     */
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            this.scallop = new Scallop({
                addressId: ScallopClient.ADDRESS_ID,
                networkType: "mainnet",
            });

            await this.scallop.init();
            this.scallopQuery = await this.scallop.createScallopQuery();
            this.scallopBuilder = await this.scallop.createScallopBuilder();
            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize Scallop SDK:", error);
            throw error;
        }
    }

    /**
     * Get all pool/market information with current APYs
     */
    async getPoolsInfo(): Promise<ScallopPoolInfo[]> {
        try {
            await this.initialize();
            if (!this.scallopQuery) throw new Error("ScallopQuery not initialized");

            const marketData = await this.scallopQuery.getMarketPools();
            const pools: ScallopPoolInfo[] = [];

            for (const [coinKey, coinName] of Object.entries(SCALLOP_COINS)) {
                try {
                    // Access pools from the market data
                    const poolData = marketData.pools?.[coinName];
                    if (poolData) {
                        pools.push({
                            coin: coinKey as ScallopCoin,
                            coinType: this.getCoinType(coinKey as ScallopCoin),
                            supplyApy: poolData.supplyApy || 0,
                            borrowApy: poolData.borrowApy || 0,
                            totalSupply: poolData.supplyAmount || 0,
                            totalBorrow: poolData.borrowAmount || 0,
                            availableLiquidity: (poolData.supplyAmount || 0) - (poolData.borrowAmount || 0),
                            price: poolData.coinPrice || 0,
                            decimals: this.getDecimals(coinKey as ScallopCoin),
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to get Scallop pool info for ${coinName}:`, error);
                }
            }

            return pools;
        } catch (error) {
            console.error("Failed to get Scallop pools info:", error);
            return [];
        }
    }

    /**
     * Get user positions in Scallop Protocol
     */
    async getUserPositions(address: string): Promise<ScallopPosition[]> {
        try {
            await this.initialize();
            if (!this.scallopQuery) throw new Error("ScallopQuery not initialized");

            const positions: ScallopPosition[] = [];

            // Get user's lending positions - first param is array of coin names
            const coinNames = Object.values(SCALLOP_COINS);
            const lendings = await this.scallopQuery.getLendings(coinNames, address);

            // Get user's obligations (borrowed assets)
            const obligations = await this.scallopQuery.getObligations(address);

            // Process lending positions
            for (const [coinKey, coinName] of Object.entries(SCALLOP_COINS)) {
                try {
                    const lendingData = lendings?.[coinName];
                    const lendingAmount = lendingData?.suppliedAmount || 0;
                    let borrowAmount = 0;

                    // Check obligations for borrowed amounts
                    if (obligations && obligations.length > 0) {
                        for (const obligation of obligations) {
                            // Get the obligation details using queryObligation if needed
                            // For now, check if there's debt info directly
                            const obligationData = obligation as unknown as Record<string, unknown>;
                            const debts = obligationData.debts as Array<{ coinName: string; amount?: number }> | undefined;
                            if (debts) {
                                const borrowedAsset = debts.find(d => d.coinName === coinName);
                                if (borrowedAsset && borrowedAsset.amount) {
                                    borrowAmount += borrowedAsset.amount;
                                }
                            }
                        }
                    }

                    if (lendingAmount > 0 || borrowAmount > 0) {
                        const decimals = this.getDecimals(coinKey as ScallopCoin);
                        const price = lendingData?.coinPrice || 0;

                        positions.push({
                            coin: coinKey as ScallopCoin,
                            coinType: this.getCoinType(coinKey as ScallopCoin),
                            supplied: BigInt(Math.floor(lendingAmount * Math.pow(10, decimals))),
                            suppliedUsd: lendingAmount * price,
                            borrowed: BigInt(Math.floor(borrowAmount * Math.pow(10, decimals))),
                            borrowedUsd: borrowAmount * price,
                            supplyApy: lendingData?.supplyApy || 0,
                            borrowApy: 0, // Would need to get from pool data
                            decimals,
                        });
                    }
                } catch (error) {
                    console.debug(`No Scallop position for ${coinName}:`, error);
                }
            }

            return positions;
        } catch (error) {
            console.error("Failed to get Scallop user positions:", error);
            return [];
        }
    }

    /**
     * Get APYs for all pools
     */
    async getApys(): Promise<Record<ScallopCoin, { supplyApy: number; borrowApy: number }>> {
        const pools = await this.getPoolsInfo();
        const apys: Record<string, { supplyApy: number; borrowApy: number }> = {};

        for (const pool of pools) {
            apys[pool.coin] = {
                supplyApy: pool.supplyApy,
                borrowApy: pool.borrowApy,
            };
        }

        return apys as Record<ScallopCoin, { supplyApy: number; borrowApy: number }>;
    }

    /**
     * Build a withdraw transaction for Scallop
     * Uses ScallopBuilder for transaction construction
     */
    async buildWithdrawTx(
        coin: ScallopCoin,
        amount: bigint,
        senderAddress: string,
    ): Promise<Uint8Array> {
        await this.initialize();
        if (!this.scallopBuilder) throw new Error("ScallopBuilder not initialized");

        const coinName = SCALLOP_COINS[coin];
        const decimals = this.getDecimals(coin);
        const amountNumber = Number(amount) / Math.pow(10, decimals);

        // Create withdraw transaction using builder
        const txb = await this.scallopBuilder.createTxBlock();
        await txb.withdrawQuick(amountNumber, coinName);

        const txBytes = await txb.txBlock.build({ client: this.suiClient });
        return txBytes;
    }

    /**
     * Build a deposit transaction for Scallop
     */
    async buildDepositTx(
        coin: ScallopCoin,
        amount: bigint,
        senderAddress: string,
    ): Promise<Uint8Array> {
        await this.initialize();
        if (!this.scallopBuilder) throw new Error("ScallopBuilder not initialized");

        const coinName = SCALLOP_COINS[coin];
        const decimals = this.getDecimals(coin);
        const amountNumber = Number(amount) / Math.pow(10, decimals);

        // Create deposit transaction using builder
        const txb = await this.scallopBuilder.createTxBlock();
        await txb.depositQuick(amountNumber, coinName);

        const txBytes = await txb.txBlock.build({ client: this.suiClient });
        return txBytes;
    }

    /**
     * Get the ScallopBuilder for advanced transaction building
     */
    async getBuilder(): Promise<ScallopBuilder> {
        await this.initialize();
        if (!this.scallopBuilder) throw new Error("ScallopBuilder not initialized");
        return this.scallopBuilder;
    }

    /**
     * Get coin type address for a Scallop coin
     */
    private getCoinType(coin: ScallopCoin): string {
        const coinTypes: Record<ScallopCoin, string> = {
            SUI: "0x2::sui::SUI",
            USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
            WETH: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
            CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
            SCA: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
        };
        return coinTypes[coin];
    }

    /**
     * Get decimals for a coin
     */
    private getDecimals(coin: ScallopCoin): number {
        const decimals: Record<ScallopCoin, number> = {
            SUI: 9,
            USDC: 6,
            USDT: 6,
            WETH: 8,
            CETUS: 9,
            SCA: 9,
        };
        return decimals[coin];
    }
}

/**
 * Create a ScallopClient instance
 */
export function createScallopClient(suiClient: SuiClient): ScallopClient {
    return new ScallopClient(suiClient);
}
