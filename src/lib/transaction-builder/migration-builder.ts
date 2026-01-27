import { Transaction } from "@mysten/sui/transactions";
import { NAVI, SCALLOP, MAGMA, COIN_TYPES } from "../protocols/constants";

export type MigrationRoute =
    | "navi-to-scallop"
    | "scallop-to-navi"
    | "navi-to-magma"
    | "scallop-to-magma";

export interface MigrationParams {
    amount: bigint;
    coinType: string;
    route: MigrationRoute;
}

/**
 * MigrationBuilder - Constructs Programmable Transaction Blocks (PTBs)
 * for cross-protocol migrations on Sui.
 * 
 * This class chains multiple protocol operations into a single atomic transaction,
 * enabling 1-click migrations between DeFi protocols.
 */
export class MigrationBuilder {
    private tx: Transaction;

    constructor() {
        this.tx = new Transaction();
    }

    /**
     * Build a migration from Navi to Scallop (lending to lending)
     */
    buildNaviToScallop(amount: bigint, coinType: string = COIN_TYPES.SUI): Transaction {
        this.tx = new Transaction();

        // Step 1: Withdraw from Navi Protocol
        // The withdraw returns a Coin object that we can use directly
        const [withdrawnCoin] = this.tx.moveCall({
            target: `${NAVI.PACKAGE_ID}::lending::withdraw`,
            arguments: [
                this.tx.object(NAVI.POOLS.SUI.poolId),
                this.tx.pure.u64(amount),
            ],
            typeArguments: [coinType],
        });

        // Step 2: Deposit into Scallop
        this.tx.moveCall({
            target: `${SCALLOP.PACKAGE_ID}::lending::deposit`,
            arguments: [
                this.tx.object(SCALLOP.MARKET_ID),
                this.tx.object(SCALLOP.VERSION),
                withdrawnCoin,
            ],
            typeArguments: [coinType],
        });

        return this.tx;
    }

    /**
     * Build a migration from Scallop to Navi (lending to lending)
     */
    buildScallopToNavi(amount: bigint, coinType: string = COIN_TYPES.SUI): Transaction {
        this.tx = new Transaction();

        // Step 1: Withdraw from Scallop
        const [withdrawnCoin] = this.tx.moveCall({
            target: `${SCALLOP.PACKAGE_ID}::lending::withdraw`,
            arguments: [
                this.tx.object(SCALLOP.MARKET_ID),
                this.tx.object(SCALLOP.VERSION),
                this.tx.pure.u64(amount),
            ],
            typeArguments: [coinType],
        });

        // Step 2: Deposit into Navi
        this.tx.moveCall({
            target: `${NAVI.PACKAGE_ID}::lending::deposit`,
            arguments: [
                this.tx.object(NAVI.POOLS.SUI.poolId),
                withdrawnCoin,
            ],
            typeArguments: [coinType],
        });

        return this.tx;
    }

    /**
     * Build a migration from Navi to Magma LP
     * This is more complex as it requires:
     * 1. Withdraw from Navi
     * 2. Split the coin (50% for each side of LP)
     * 3. (Optionally) Swap half to the other token
     * 4. Add liquidity to Magma
     */
    buildNaviToMagma(
        amount: bigint,
        coinType: string = COIN_TYPES.SUI,
    ): Transaction {
        this.tx = new Transaction();

        // Step 1: Withdraw from Navi
        const [withdrawnCoin] = this.tx.moveCall({
            target: `${NAVI.PACKAGE_ID}::lending::withdraw`,
            arguments: [
                this.tx.object(NAVI.POOLS.SUI.poolId),
                this.tx.pure.u64(amount),
            ],
            typeArguments: [coinType],
        });

        // Step 2: Split the coin in half for LP
        const halfAmount = amount / 2n;
        const [coinA] = this.tx.splitCoins(withdrawnCoin, [this.tx.pure.u64(halfAmount)]);

        // Note: In a real implementation, we would swap coinA to USDC here
        // using Cetus or another DEX. For MVP, we assume user provides both coins.

        // Step 3: Add liquidity to Magma
        // This is a simplified version - actual Magma SDK has more params
        this.tx.moveCall({
            target: `${MAGMA.PACKAGE_ID}::pool::add_liquidity`,
            arguments: [
                this.tx.object(MAGMA.POOLS.SUI_USDC.poolId),
                coinA, // First half
                withdrawnCoin, // Remaining half
                this.tx.pure.u64(0), // min_amount_a
                this.tx.pure.u64(0), // min_amount_b
            ],
            typeArguments: [
                MAGMA.POOLS.SUI_USDC.coinTypeA,
                MAGMA.POOLS.SUI_USDC.coinTypeB,
            ],
        });

        return this.tx;
    }

    /**
     * Build any migration route
     */
    build(params: MigrationParams): Transaction {
        switch (params.route) {
            case "navi-to-scallop":
                return this.buildNaviToScallop(params.amount, params.coinType);
            case "scallop-to-navi":
                return this.buildScallopToNavi(params.amount, params.coinType);
            case "navi-to-magma":
                return this.buildNaviToMagma(params.amount, params.coinType);
            default:
                throw new Error(`Unsupported migration route: ${params.route}`);
        }
    }

    /**
     * Get the current transaction for inspection
     */
    getTransaction(): Transaction {
        return this.tx;
    }
}

/**
 * Utility function to estimate gas for a migration
 */
export async function estimateMigrationGas(
    client: unknown,
    tx: Transaction,
    sender: string,
): Promise<bigint> {
    // In a real implementation, we'd use client.dryRunTransactionBlock
    // For now, return a reasonable estimate
    return 10_000_000n; // 0.01 SUI
}
