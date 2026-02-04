"use client";

import { NAVISDKClient, PoolConfig, CoinInfo } from "navi-sdk";
import { Sui, USDT, WETH, CETUS, NAVX, wUSDC } from "navi-sdk/dist/address";
import { SuiClient } from "@mysten/sui/client";

// Map of our coin keys to navi-sdk CoinInfo objects
const NAVI_COIN_INFO: Record<string, CoinInfo> = {
    SUI: Sui,
    USDC: wUSDC,
    USDT: USDT,
    WETH: WETH,
    CETUS: CETUS,
    NAVX: NAVX,
};

// Navi supported coins
export const NAVI_COINS = {
    SUI: "SUI",
    USDC: "USDC",
    USDT: "USDT",
    WETH: "WETH",
    CETUS: "CETUS",
    NAVX: "NAVX",
} as const;

export type NaviCoin = keyof typeof NAVI_COINS;

export interface NaviPosition {
    coin: NaviCoin;
    coinType: string;
    supplied: bigint;
    suppliedUsd: number;
    borrowed: bigint;
    borrowedUsd: number;
    supplyApy: number;
    borrowApy: number;
    decimals: number;
}

export interface NaviPoolInfo {
    coin: NaviCoin;
    coinType: string;
    supplyApy: number;
    borrowApy: number;
    totalSupply: bigint;
    totalBorrow: bigint;
    availableLiquidity: bigint;
    decimals: number;
}

/**
 * Navi Protocol Client
 * Wraps the navi-sdk for clean integration with Porta
 */
export class NaviClient {
    private client: NAVISDKClient | null = null;
    private suiClient: SuiClient;
    private network: "mainnet" | "testnet";

    constructor(suiClient: SuiClient, network: "mainnet" | "testnet" = "mainnet") {
        this.suiClient = suiClient;
        this.network = network;
    }

    /**
     * Initialize the NAVI SDK client
     * Note: For querying, we don't need a mnemonic
     */
    private async getClient(): Promise<NAVISDKClient> {
        if (!this.client) {
            this.client = new NAVISDKClient({
                networkType: this.network,
                numberOfAccounts: 1,
            });
        }
        return this.client;
    }

    /**
     * Get all pool information with current APYs
     */
    async getPoolsInfo(): Promise<NaviPoolInfo[]> {
        try {
            const client = await this.getClient();
            const pools: NaviPoolInfo[] = [];

            // Get pool info for each supported coin
            for (const [coinKey] of Object.entries(NAVI_COINS)) {
                try {
                    const coinInfo = NAVI_COIN_INFO[coinKey];
                    if (!coinInfo) continue;

                    const poolInfo = await client.getPoolInfo(coinInfo);
                    if (poolInfo) {
                        // Use type assertion since SDK returns dynamic object
                        const info = poolInfo as Record<string, unknown>;
                        pools.push({
                            coin: coinKey as NaviCoin,
                            coinType: this.getCoinType(coinKey as NaviCoin),
                            supplyApy: parseFloat(String(info.base_supply_rate || info.boosted_supply_rate || 0)),
                            borrowApy: parseFloat(String(info.base_borrow_rate || info.boosted_borrow_rate || 0)),
                            totalSupply: BigInt(Math.floor(Number(info.total_supply || 0))),
                            totalBorrow: BigInt(Math.floor(Number(info.total_borrow || 0))),
                            availableLiquidity: BigInt(Math.floor(Number(info.total_supply || 0) - Number(info.total_borrow || 0))),
                            decimals: this.getDecimals(coinKey as NaviCoin),
                        });
                    }
                } catch (error) {
                    console.warn(`Failed to get Navi pool info for ${coinKey}:`, error);
                }
            }

            return pools;
        } catch (error) {
            console.error("Failed to get Navi pools info:", error);
            return [];
        }
    }

    /**
     * Get user positions in Navi Protocol
     * Returns empty array gracefully on any error
     */
    async getUserPositions(address: string): Promise<NaviPosition[]> {
        try {
            // Wrap client initialization in timeout
            const clientPromise = Promise.race([
                this.getClient(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("Navi SDK initialization timeout")), 10000)
                )
            ]);

            const client = await clientPromise;
            const positions: NaviPosition[] = [];

            // Get all portfolios with timeout protection
            let portfolios: Map<string, { supplyBalance: number; borrowBalance: number }> | null = null;

            try {
                portfolios = await Promise.race([
                    client.getAllNaviPortfolios(),
                    new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error("getAllNaviPortfolios timeout")), 8000)
                    )
                ]) as Map<string, { supplyBalance: number; borrowBalance: number }> | null;
            } catch (portfolioError) {
                console.warn("Navi: Failed to get portfolios:", portfolioError);
                return [];
            }

            if (!portfolios) {
                return [];
            }

            // Get pool info for prices and rates
            for (const [coinKey] of Object.entries(NAVI_COINS)) {
                try {
                    const coinInfo = NAVI_COIN_INFO[coinKey];
                    if (!coinInfo) continue;

                    const coinSymbol = coinInfo.symbol;
                    const balance = portfolios.get(coinSymbol);

                    if (balance && (balance.supplyBalance > 0 || balance.borrowBalance > 0)) {
                        // Get pool info for price and rates (with timeout)
                        let poolInfo: Record<string, unknown> = {};
                        try {
                            poolInfo = await Promise.race([
                                client.getPoolInfo(coinInfo),
                                new Promise<Record<string, unknown>>((resolve) =>
                                    setTimeout(() => resolve({}), 5000)
                                )
                            ]) as Record<string, unknown>;
                        } catch {
                            // Continue without pool info
                        }

                        const tokenPrice = Number(poolInfo.tokenPrice || 0);

                        positions.push({
                            coin: coinKey as NaviCoin,
                            coinType: this.getCoinType(coinKey as NaviCoin),
                            supplied: BigInt(Math.floor(balance.supplyBalance * Math.pow(10, this.getDecimals(coinKey as NaviCoin)))),
                            suppliedUsd: balance.supplyBalance * tokenPrice,
                            borrowed: BigInt(Math.floor(balance.borrowBalance * Math.pow(10, this.getDecimals(coinKey as NaviCoin)))),
                            borrowedUsd: balance.borrowBalance * tokenPrice,
                            supplyApy: parseFloat(String(poolInfo.base_supply_rate || poolInfo.boosted_supply_rate || 0)),
                            borrowApy: parseFloat(String(poolInfo.base_borrow_rate || poolInfo.boosted_borrow_rate || 0)),
                            decimals: this.getDecimals(coinKey as NaviCoin),
                        });
                    }
                } catch (error) {
                    // Silently continue - individual coin errors are expected
                }
            }

            return positions;
        } catch (error) {
            console.warn("Navi: getUserPositions failed, returning empty array:",
                error instanceof Error ? error.message : "Unknown error");
            return [];
        }
    }

    /**
     * Get APYs for all pools
     */
    async getApys(): Promise<Record<NaviCoin, { supplyApy: number; borrowApy: number }>> {
        const pools = await this.getPoolsInfo();
        const apys: Record<string, { supplyApy: number; borrowApy: number }> = {};

        for (const pool of pools) {
            apys[pool.coin] = {
                supplyApy: pool.supplyApy,
                borrowApy: pool.borrowApy,
            };
        }

        return apys as Record<NaviCoin, { supplyApy: number; borrowApy: number }>;
    }

    /**
     * Build a withdraw transaction for Navi
     * Returns transaction bytes that can be signed
     */
    async buildWithdrawTx(
        coin: NaviCoin,
        amount: bigint,
        senderAddress: string,
    ): Promise<Uint8Array> {
        const client = await this.getClient();
        const account = client.accounts[0];
        const coinInfo = NAVI_COIN_INFO[coin];

        // Use the SDK's withdraw function to build the transaction
        const txb = await account.withdraw(
            coinInfo,
            Number(amount) / Math.pow(10, this.getDecimals(coin)),
        );

        // Build and return the transaction bytes
        const txBytes = await txb.build({ client: this.suiClient });
        return txBytes;
    }

    /**
     * Build a deposit transaction for Navi
     */
    async buildDepositTx(
        coin: NaviCoin,
        amount: bigint,
        senderAddress: string,
    ): Promise<Uint8Array> {
        const client = await this.getClient();
        const account = client.accounts[0];
        const coinInfo = NAVI_COIN_INFO[coin];

        // Use the SDK's depositToNavi function
        const txb = await account.depositToNavi(
            coinInfo,
            Number(amount) / Math.pow(10, this.getDecimals(coin)),
        );

        const txBytes = await txb.build({ client: this.suiClient });
        return txBytes;
    }

    /**
     * Get coin type address for a Navi coin
     */
    private getCoinType(coin: NaviCoin): string {
        const coinTypes: Record<NaviCoin, string> = {
            SUI: "0x2::sui::SUI",
            USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
            USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
            WETH: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
            CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
            NAVX: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
        };
        return coinTypes[coin];
    }

    /**
     * Get decimals for a coin
     */
    private getDecimals(coin: NaviCoin): number {
        const decimals: Record<NaviCoin, number> = {
            SUI: 9,
            USDC: 6,
            USDT: 6,
            WETH: 8,
            CETUS: 9,
            NAVX: 9,
        };
        return decimals[coin];
    }
}

/**
 * Create a NaviClient instance
 */
export function createNaviClient(
    suiClient: SuiClient,
    network: "mainnet" | "testnet" = "mainnet",
): NaviClient {
    return new NaviClient(suiClient, network);
}
