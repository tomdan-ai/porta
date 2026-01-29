/**
 * Protocol Configuration and Metadata
 * 
 * This file contains protocol metadata for UI display purposes.
 * Actual contract addresses are managed by the respective protocol SDKs.
 */

// Verified Coin Type Addresses (Mainnet)
export const COIN_TYPES = {
    SUI: "0x2::sui::SUI",
    USDC: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
    USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    WETH: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
    CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
    NAVX: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
    SCA: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
} as const;

// Decimal places for each coin
export const COIN_DECIMALS: Record<string, number> = {
    SUI: 9,
    USDC: 6,
    USDT: 6,
    WETH: 8,
    CETUS: 9,
    NAVX: 9,
    SCA: 9,
};

// Protocol metadata for UI display
export const PROTOCOLS = {
    NAVI: {
        id: "navi" as const,
        name: "Navi Protocol",
        logo: "/protocols/navi.svg",
        type: "lending" as const,
        color: "#4F46E5",
        description: "Leading lending protocol on Sui",
        website: "https://naviprotocol.io",
        supportedCoins: ["SUI", "USDC", "USDT", "WETH", "CETUS", "NAVX"],
    },
    SCALLOP: {
        id: "scallop" as const,
        name: "Scallop",
        logo: "/protocols/scallop.svg",
        type: "lending" as const,
        color: "#10B981",
        description: "Secure lending market on Sui",
        website: "https://scallop.io",
        supportedCoins: ["SUI", "USDC", "USDT", "WETH", "CETUS", "SCA"],
    },
    MAGMA: {
        id: "magma" as const,
        name: "Magma Finance",
        logo: "/protocols/magma.svg",
        type: "liquidity" as const,
        color: "#F59E0B",
        description: "High-yield adaptive liquidity pools",
        website: "https://magmafinance.io",
        supportedCoins: ["SUI", "USDC"],
    },
    CETUS: {
        id: "cetus" as const,
        name: "Cetus",
        logo: "/protocols/cetus.svg",
        type: "dex" as const,
        color: "#06B6D4",
        description: "Concentrated liquidity DEX",
        website: "https://cetus.zone",
        supportedCoins: ["SUI", "USDC", "USDT", "WETH", "CETUS"],
    },
} as const;

export type ProtocolKey = keyof typeof PROTOCOLS;
export type ProtocolType = "lending" | "liquidity" | "dex";

/**
 * Get protocol by its ID
 */
export function getProtocolById(id: string): typeof PROTOCOLS[ProtocolKey] | undefined {
    return Object.values(PROTOCOLS).find(p => p.id === id);
}

/**
 * Get all lending protocols
 */
export function getLendingProtocols(): typeof PROTOCOLS[ProtocolKey][] {
    return Object.values(PROTOCOLS).filter(p => p.type === "lending");
}

/**
 * Get all liquidity protocols
 */
export function getLiquidityProtocols(): typeof PROTOCOLS[ProtocolKey][] {
    return Object.values(PROTOCOLS).filter(p => p.type === "liquidity");
}

/**
 * Check if a coin is supported by a protocol
 */
export function isCoinSupported(protocol: ProtocolKey, coin: string): boolean {
    return (PROTOCOLS[protocol].supportedCoins as readonly string[]).includes(coin);
}

/**
 * Get coin decimals
 */
export function getCoinDecimals(coin: string): number {
    return COIN_DECIMALS[coin] || 9;
}

/**
 * Format amount with proper decimals
 */
export function formatAmount(amount: bigint, coin: string): string {
    const decimals = getCoinDecimals(coin);
    const value = Number(amount) / Math.pow(10, decimals);
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals > 6 ? 4 : 2,
    });
}
