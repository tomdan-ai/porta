// Protocol Package IDs and Pool Addresses
// Note: These are mainnet addresses - testnet addresses may differ

export const NETWORKS = {
    mainnet: "mainnet",
    testnet: "testnet",
} as const;

// Navi Protocol
export const NAVI = {
    PACKAGE_ID: "0x3e50d74c6c3dae3a98f9c9f1df9b9d3f7bce5f8f9c7e6d5a4b3c2d1e0f1a2b3c",
    LENDING_MARKET: "0x123...navi_market",
    POOLS: {
        SUI: {
            poolId: "0x...sui_pool",
            coinType: "0x2::sui::SUI",
            decimals: 9,
            symbol: "SUI",
        },
        USDC: {
            poolId: "0x...usdc_pool",
            coinType: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
            decimals: 6,
            symbol: "USDC",
        },
    },
} as const;

// Scallop Protocol
export const SCALLOP = {
    PACKAGE_ID: "0x4e50d74c6c3dae3a98f9c9f1df9b9d3f7bce5f8f9c7e6d5a4b3c2d1e0f1a2b3c",
    MARKET_ID: "0x123...scallop_market",
    VERSION: "0x...version",
    POOLS: {
        SUI: {
            marketCoinType: "0x...scallop_sui",
            coinType: "0x2::sui::SUI",
            decimals: 9,
            symbol: "SUI",
        },
        USDC: {
            marketCoinType: "0x...scallop_usdc",
            coinType: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
            decimals: 6,
            symbol: "USDC",
        },
    },
} as const;

// Magma Finance (CLMM)
export const MAGMA = {
    PACKAGE_ID: "0x5e50d74c6c3dae3a98f9c9f1df9b9d3f7bce5f8f9c7e6d5a4b3c2d1e0f1a2b3c",
    POOLS: {
        SUI_USDC: {
            poolId: "0x...sui_usdc_pool",
            coinTypeA: "0x2::sui::SUI",
            coinTypeB: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
            fee: 2500, // 0.25%
        },
    },
} as const;

// Cetus Protocol (for swaps)
export const CETUS = {
    PACKAGE_ID: "0x6e50d74c6c3dae3a98f9c9f1df9b9d3f7bce5f8f9c7e6d5a4b3c2d1e0f1a2b3c",
    GLOBAL_CONFIG: "0x...global_config",
    POOLS: {
        SUI_USDC: {
            poolId: "0x...cetus_sui_usdc",
            coinTypeA: "0x2::sui::SUI",
            coinTypeB: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
        },
    },
} as const;

// Coin Types
export const COIN_TYPES = {
    SUI: "0x2::sui::SUI",
    USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
} as const;

// Protocol metadata for UI
export const PROTOCOLS = {
    NAVI: {
        name: "Navi Protocol",
        logo: "/protocols/navi.svg",
        type: "lending" as const,
        color: "#4F46E5",
        description: "Leading lending protocol on Sui",
    },
    SCALLOP: {
        name: "Scallop",
        logo: "/protocols/scallop.svg",
        type: "lending" as const,
        color: "#10B981",
        description: "Secure lending market on Sui",
    },
    MAGMA: {
        name: "Magma Finance",
        logo: "/protocols/magma.svg",
        type: "liquidity" as const,
        color: "#F59E0B",
        description: "High-yield adaptive liquidity pools",
    },
    CETUS: {
        name: "Cetus",
        logo: "/protocols/cetus.svg",
        type: "dex" as const,
        color: "#06B6D4",
        description: "Concentrated liquidity DEX",
    },
} as const;
