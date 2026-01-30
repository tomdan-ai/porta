import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { createNaviClient, type NaviCoin } from "../protocols/navi-client";
import { createScallopClient, type ScallopCoin, SCALLOP_COINS } from "../protocols/scallop-client";
import { createCetusSwapHelper } from "../protocols/cetus-swap";
import { COIN_TYPES, getCoinDecimals } from "../protocols/constants";

export type MigrationRoute =
    | "navi-to-scallop"
    | "scallop-to-navi"
    | "navi-to-magma"
    | "scallop-to-magma";

export interface MigrationParams {
    amount: bigint;
    coin: string;
    coinType: string;
    route: MigrationRoute;
    senderAddress: string;
}

export interface MigrationEstimate {
    gasEstimate: bigint;
    gasCostUsd: number;
    expectedOutput: bigint;
    priceImpact: number;
}

/**
 * MigrationBuilder - Constructs Programmable Transaction Blocks (PTBs)
 * for cross-protocol migrations on Sui.
 * 
 * This class uses official protocol SDKs to chain multiple operations
 * into a single atomic transaction, enabling 1-click migrations.
 */
export class MigrationBuilder {
    private suiClient: SuiClient;
    private naviClient: ReturnType<typeof createNaviClient>;
    private scallopClient: ReturnType<typeof createScallopClient>;
    private cetusSwapHelper: ReturnType<typeof createCetusSwapHelper>;

    constructor(suiClient: SuiClient) {
        this.suiClient = suiClient;
        this.naviClient = createNaviClient(suiClient, "mainnet");
        this.scallopClient = createScallopClient(suiClient);
        this.cetusSwapHelper = createCetusSwapHelper(suiClient);
    }

    /**
     * Build a migration from Navi to Scallop (lending to lending)
     * Uses both protocol SDKs to construct a combined transaction
     */
    async buildNaviToScallop(
        coin: string,
        amount: bigint,
        senderAddress: string,
    ): Promise<Transaction> {
        const tx = new Transaction();
        tx.setSender(senderAddress);

        const decimals = getCoinDecimals(coin);
        const coinType = COIN_TYPES[coin as keyof typeof COIN_TYPES] || COIN_TYPES.SUI;

        // Get the Scallop builder for deposit operations
        const scallopBuilder = await this.scallopClient.getBuilder();
        const scallopTxBlock = await scallopBuilder.createTxBlock();

        // Step 1: Withdraw from Navi Protocol
        // The Navi SDK provides the withdraw function
        const naviCoin = coin as NaviCoin;

        // Build withdraw call using Navi's lending module
        // Note: Actual implementation depends on Navi SDK's PTB support
        const [withdrawnCoin] = tx.moveCall({
            target: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::lending::withdraw",
            arguments: [
                tx.pure.u64(amount),
            ],
            typeArguments: [coinType],
        });

        // Step 2: Deposit into Scallop
        // Use Scallop's deposit function with the withdrawn coin
        const scallopCoinName = SCALLOP_COINS[coin as ScallopCoin] || "sui";

        // Scallop deposit - this uses their market module
        tx.moveCall({
            target: "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::deposit::deposit",
            arguments: [
                withdrawnCoin,
            ],
            typeArguments: [coinType],
        });

        return tx;
    }

    /**
     * Build a migration from Scallop to Navi (lending to lending)
     */
    async buildScallopToNavi(
        coin: string,
        amount: bigint,
        senderAddress: string,
    ): Promise<Transaction> {
        const tx = new Transaction();
        tx.setSender(senderAddress);

        const decimals = getCoinDecimals(coin);
        const coinType = COIN_TYPES[coin as keyof typeof COIN_TYPES] || COIN_TYPES.SUI;

        // Step 1: Withdraw from Scallop
        const [withdrawnCoin] = tx.moveCall({
            target: "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::withdraw::withdraw",
            arguments: [
                tx.pure.u64(amount),
            ],
            typeArguments: [coinType],
        });

        // Step 2: Deposit into Navi
        tx.moveCall({
            target: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::lending::deposit",
            arguments: [
                withdrawnCoin,
            ],
            typeArguments: [coinType],
        });

        return tx;
    }

    /**
     * Build a migration from Navi to Magma (lending to liquidity)
     * Steps:
     * 1. Withdraw from Navi
     * 2. Split the withdrawn amount in half
     * 3. Swap half for the pair coin using Cetus
     * 4. Add liquidity to Magma with both coins
     */
    async buildNaviToMagma(
        coin: string,
        amount: bigint,
        senderAddress: string,
    ): Promise<Transaction> {
        const tx = new Transaction();
        tx.setSender(senderAddress);

        const coinType = COIN_TYPES[coin as keyof typeof COIN_TYPES] || COIN_TYPES.SUI;

        // Step 1: Withdraw from Navi
        const [withdrawnCoin] = tx.moveCall({
            target: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::lending::withdraw",
            arguments: [tx.pure.u64(amount.toString())],
            typeArguments: [coinType],
        });

        // Step 2: Split the withdrawn coin in half
        const halfAmount = amount / 2n;
        const [halfCoin] = tx.splitCoins(withdrawnCoin, [tx.pure.u64(halfAmount.toString())]);

        // Step 3: Determine pair coin and swap
        let pairCoinType: string;
        if (coin === "SUI") {
            pairCoinType = COIN_TYPES.USDC;
        } else if (coin === "USDC") {
            pairCoinType = COIN_TYPES.SUI;
        } else {
            throw new Error(`Unsupported coin for Magma migration: ${coin}`);
        }

        const swappedCoin = await this.cetusSwapHelper.buildSwapCall(tx, halfCoin, {
            coinTypeIn: coinType,
            coinTypeOut: pairCoinType,
            amountIn: halfAmount,
            slippageTolerance: 0.01,
        });

        // Step 4: Add liquidity to Magma
        const [coinA, coinB, typeA, typeB] = coinType < pairCoinType
            ? [withdrawnCoin, swappedCoin, coinType, pairCoinType]
            : [swappedCoin, withdrawnCoin, pairCoinType, coinType];

        tx.moveCall({
            target: "0x<MAGMA_PACKAGE>::pool::add_liquidity",
            arguments: [
                tx.object("0x<MAGMA_GLOBAL_CONFIG>"),
                tx.object("0x<MAGMA_SUI_USDC_POOL>"),
                coinA,
                coinB,
                tx.pure.u64(halfAmount.toString()),
                tx.pure.u64(halfAmount.toString()),
                tx.pure.u64("0"),
                tx.pure.u64("0"),
                tx.object("0x6"),
            ],
            typeArguments: [typeA, typeB],
        });

        return tx;
    }

    /**
     * Build a migration from Scallop to Magma (lending to liquidity)
     */
    async buildScallopToMagma(
        coin: string,
        amount: bigint,
        senderAddress: string,
    ): Promise<Transaction> {
        const tx = new Transaction();
        tx.setSender(senderAddress);

        const coinType = COIN_TYPES[coin as keyof typeof COIN_TYPES] || COIN_TYPES.SUI;

        // Step 1: Withdraw from Scallop
        const [withdrawnCoin] = tx.moveCall({
            target: "0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::withdraw::withdraw",
            arguments: [tx.pure.u64(amount.toString())],
            typeArguments: [coinType],
        });

        // Step 2: Split and swap
        const halfAmount = amount / 2n;
        const [halfCoin] = tx.splitCoins(withdrawnCoin, [tx.pure.u64(halfAmount.toString())]);

        let pairCoinType: string;
        if (coin === "SUI") {
            pairCoinType = COIN_TYPES.USDC;
        } else if (coin === "USDC") {
            pairCoinType = COIN_TYPES.SUI;
        } else {
            throw new Error(`Unsupported coin for Magma migration: ${coin}`);
        }

        const swappedCoin = await this.cetusSwapHelper.buildSwapCall(tx, halfCoin, {
            coinTypeIn: coinType,
            coinTypeOut: pairCoinType,
            amountIn: halfAmount,
            slippageTolerance: 0.01,
        });

        const [coinA, coinB, typeA, typeB] = coinType < pairCoinType
            ? [withdrawnCoin, swappedCoin, coinType, pairCoinType]
            : [swappedCoin, withdrawnCoin, pairCoinType, coinType];

        tx.moveCall({
            target: "0x<MAGMA_PACKAGE>::pool::add_liquidity",
            arguments: [
                tx.object("0x<MAGMA_GLOBAL_CONFIG>"),
                tx.object("0x<MAGMA_SUI_USDC_POOL>"),
                coinA,
                coinB,
                tx.pure.u64(halfAmount.toString()),
                tx.pure.u64(halfAmount.toString()),
                tx.pure.u64("0"),
                tx.pure.u64("0"),
                tx.object("0x6"),
            ],
            typeArguments: [typeA, typeB],
        });

        return tx;
    }

    /**
     * Build any migration route
     */
    async build(params: MigrationParams): Promise<Transaction> {
        switch (params.route) {
            case "navi-to-scallop":
                return this.buildNaviToScallop(params.coin, params.amount, params.senderAddress);
            case "scallop-to-navi":
                return this.buildScallopToNavi(params.coin, params.amount, params.senderAddress);
            case "navi-to-magma":
                return this.buildNaviToMagma(params.coin, params.amount, params.senderAddress);
            case "scallop-to-magma":
                return this.buildScallopToMagma(params.coin, params.amount, params.senderAddress);
            default:
                throw new Error(`Unsupported migration route: ${params.route}`);
        }
    }

    /**
     * Estimate gas for a migration transaction using dryRunTransactionBlock
     */
    async estimateGas(tx: Transaction): Promise<MigrationEstimate> {
        try {
            const dryRunResult = await this.suiClient.dryRunTransactionBlock({
                transactionBlock: await tx.build({ client: this.suiClient }),
            });

            // Parse gas from dry run result
            const gasUsed = dryRunResult.effects.gasUsed;
            const totalGas = BigInt(gasUsed.computationCost) +
                BigInt(gasUsed.storageCost) -
                BigInt(gasUsed.storageRebate);

            // Estimate USD cost (assuming SUI price ~$1.20)
            const suiPrice = 1.20;
            const gasCostSui = Number(totalGas) / 1_000_000_000;
            const gasCostUsd = gasCostSui * suiPrice;

            return {
                gasEstimate: totalGas,
                gasCostUsd,
                expectedOutput: 0n, // Would need to parse the transaction effects
                priceImpact: 0, // No price impact for lending migrations
            };
        } catch (error) {
            console.error("Failed to estimate gas:", error);

            // Return a reasonable fallback estimate
            return {
                gasEstimate: 10_000_000n, // 0.01 SUI
                gasCostUsd: 0.012,
                expectedOutput: 0n,
                priceImpact: 0,
            };
        }
    }

    /**
     * Validate a migration is possible
     */
    async validateMigration(params: MigrationParams): Promise<{
        valid: boolean;
        error?: string;
    }> {
        // Check if coin is supported on both protocols
        const supportedCoins = ["SUI", "USDC", "USDT", "WETH", "CETUS"];

        if (!supportedCoins.includes(params.coin)) {
            return {
                valid: false,
                error: `Coin ${params.coin} is not supported for migration`,
            };
        }

        if (params.amount <= 0n) {
            return {
                valid: false,
                error: "Amount must be greater than 0",
            };
        }

        // Additional validation could check:
        // - User has sufficient balance
        // - Protocol has sufficient liquidity
        // - User's health factor won't drop dangerously

        return { valid: true };
    }
}

/**
 * Create a MigrationBuilder instance
 */
export function createMigrationBuilder(suiClient: SuiClient): MigrationBuilder {
    return new MigrationBuilder(suiClient);
}
