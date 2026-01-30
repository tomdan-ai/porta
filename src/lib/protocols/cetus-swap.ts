import { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { COIN_TYPES } from "./constants";

/**
 * Cetus DEX Integration Helper
 * Provides utilities for building swap calls within PTBs
 */

// Cetus mainnet contract addresses
const CETUS_CONFIG = {
    GLOBAL_CONFIG: "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
    CLMM_INTEGRATE: "0x0868b71c0cba55bf0faf6c40df8c179c67a4d0ba0e79965b68b3d72d7dfbf666",
    // SUI-USDC pool (fee: 0.3%)
    SUI_USDC_POOL: "0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630",
};

export interface SwapParams {
    coinTypeIn: string;
    coinTypeOut: string;
    amountIn: bigint;
    slippageTolerance: number; // e.g., 0.01 for 1%
}

export class CetusSwapHelper {
    private suiClient: SuiClient;

    constructor(suiClient: SuiClient) {
        this.suiClient = suiClient;
    }

    /**
     * Build a swap call for use within a PTB
     * @param tx The transaction to add the swap to
     * @param coinIn The coin object to swap from (TransactionResult)
     * @param params Swap parameters
     * @returns The resulting coin object from the swap
     */
    async buildSwapCall(
        tx: Transaction,
        coinIn: TransactionObjectArgument,
        params: SwapParams
    ): Promise<TransactionObjectArgument> {
        const { coinTypeIn, coinTypeOut, amountIn, slippageTolerance } = params;

        // Determine swap direction (a2b)
        const a2b = this.isA2B(coinTypeIn, coinTypeOut);

        // Calculate minimum amount out based on slippage
        // For simplicity, we'll use a placeholder calculation
        // In production, you'd query the pool for the expected output
        const minAmountOut = (amountIn * BigInt(Math.floor((1 - slippageTolerance) * 1000))) / 1000n;

        // Get the appropriate pool address
        const poolAddress = this.getPoolAddress(coinTypeIn, coinTypeOut);

        // Build the swap call using Cetus router
        const [swappedCoin] = tx.moveCall({
            target: `${CETUS_CONFIG.CLMM_INTEGRATE}::router::swap`,
            arguments: [
                tx.object(CETUS_CONFIG.GLOBAL_CONFIG),
                tx.object(poolAddress),
                coinIn,
                tx.pure.bool(a2b),
                tx.pure.u64(amountIn.toString()),
                tx.pure.u64(minAmountOut.toString()),
                tx.pure.u128("79226673515401279992447579055"), // sqrt_price_limit
                tx.object("0x6"), // clock
            ],
            typeArguments: [coinTypeIn, coinTypeOut],
        });

        return swappedCoin;
    }

    /**
     * Determine if the swap is from coinA to coinB (true) or coinB to coinA (false)
     */
    private isA2B(coinTypeIn: string, coinTypeOut: string): boolean {
        // Cetus pools have a canonical ordering (coinA < coinB alphabetically)
        // We need to determine if we're swapping from A to B or B to A

        // For SUI-USDC: SUI is coinA, USDC is coinB
        if (coinTypeIn === COIN_TYPES.SUI && coinTypeOut === COIN_TYPES.USDC) {
            return true; // SUI -> USDC (a2b)
        }
        if (coinTypeIn === COIN_TYPES.USDC && coinTypeOut === COIN_TYPES.SUI) {
            return false; // USDC -> SUI (b2a)
        }

        // Default: compare addresses lexicographically
        return coinTypeIn < coinTypeOut;
    }

    /**
     * Get the pool address for a given coin pair
     * In production, this would query Cetus pools dynamically
     */
    private getPoolAddress(coinTypeIn: string, coinTypeOut: string): string {
        // For MVP, we only support SUI-USDC
        const pair = [coinTypeIn, coinTypeOut].sort().join("-");
        const suiUsdcPair = [COIN_TYPES.SUI, COIN_TYPES.USDC].sort().join("-");

        if (pair === suiUsdcPair) {
            return CETUS_CONFIG.SUI_USDC_POOL;
        }

        throw new Error(`Unsupported swap pair: ${coinTypeIn} -> ${coinTypeOut}`);
    }

    /**
     * Get the expected output amount for a swap (for estimation)
     */
    async getExpectedOutput(params: SwapParams): Promise<bigint> {
        // This would query the Cetus pool to calculate the expected output
        // For MVP, we'll return a placeholder
        // In production, use the Cetus SDK's preSwap function
        return params.amountIn; // 1:1 placeholder
    }
}

export function createCetusSwapHelper(suiClient: SuiClient): CetusSwapHelper {
    return new CetusSwapHelper(suiClient);
}
