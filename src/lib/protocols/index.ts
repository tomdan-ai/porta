/**
 * Porta Protocol Integration Layer
 * 
 * Unified exports for all protocol clients and types.
 * This module provides the main entry point for interacting with
 * supported DeFi protocols on Sui.
 */

// Navi Protocol
export {
    NaviClient,
    createNaviClient,
    NAVI_COINS,
    type NaviCoin,
    type NaviPosition,
    type NaviPoolInfo,
} from "./navi-client";

// Scallop Protocol
export {
    ScallopClient,
    createScallopClient,
    SCALLOP_COINS,
    type ScallopCoin,
    type ScallopCoinName,
    type ScallopPosition,
    type ScallopPoolInfo,
} from "./scallop-client";

// Magma Finance
export {
    MagmaClient,
    createMagmaClient,
    type MagmaPosition,
} from "./magma-client";

// Protocol metadata (names, colors, logos)
export { PROTOCOLS, COIN_TYPES } from "./constants";

// Unified types for cross-protocol operations
export interface UnifiedPosition {
    protocol: "NAVI" | "SCALLOP" | "MAGMA";
    coin: string;
    coinType: string;
    supplied: bigint;
    suppliedUsd: number;
    borrowed: bigint;
    borrowedUsd: number;
    supplyApy: number;
    borrowApy: number;
    decimals: number;
}

export interface ProtocolApys {
    protocol: "NAVI" | "SCALLOP" | "MAGMA";
    coin: string;
    supplyApy: number;
    borrowApy: number;
}

/**
 * Supported migration routes
 */
export type MigrationRoute =
    | "navi-to-scallop"
    | "scallop-to-navi"
    | "navi-to-magma"
    | "scallop-to-magma";

/**
 * Coins supported across protocols
 */
export const COMMON_COINS = {
    SUI: {
        symbol: "SUI",
        coinType: "0x2::sui::SUI",
        decimals: 9,
        logoUrl: "/coins/sui.svg",
    },
    USDC: {
        symbol: "USDC",
        coinType: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        decimals: 6,
        logoUrl: "/coins/usdc.svg",
    },
    USDT: {
        symbol: "USDT",
        coinType: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
        decimals: 6,
        logoUrl: "/coins/usdt.svg",
    },
    WETH: {
        symbol: "WETH",
        coinType: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
        decimals: 8,
        logoUrl: "/coins/weth.svg",
    },
    CETUS: {
        symbol: "CETUS",
        coinType: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
        decimals: 9,
        logoUrl: "/coins/cetus.svg",
    },
} as const;

export type CommonCoin = keyof typeof COMMON_COINS;
