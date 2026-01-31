# Technical Documentation: Porta

## 🏗️ Architecture

Porta is built as a client-side orchestrator that leverages the composability of **Sui Programmable Transaction Blocks (PTBs)**. We do not deploy custom contracts; instead, we construct complex transaction flows entirely on the client side using the TypeScript SDKs of integrated protocols.

### High-Level Flow
1. **Route Selection**: User selects Source (e.g., Navi) and Destination (e.g., Magma).
2. **Quote Generation**: App fetches current balances, calculates exchange rates via Cetus (if needed), and estimates gas.
3. **PTB Construction**: A `Transaction` object is instantiated.
    - **Step A**: `moveCall` to Source Protocol to withdraw funds.
    - **Step B**: `moveCall` to Cetus Router to swap funds (if Source Coin != Dest Coin).
    - **Step C**: `moveCall` to Destination Protocol to deposit/add liquidity.
4. **Execution**: The atomic transaction bundle is signed by the user and submitted to the Sui network.

---

## 🔌 Protocol Integrations

### 1. Navi Protocol (Lending)
*   **Role**: Source of Funds.
*   **Interaction**: We interact with the Navi Lending Pools to withdraw supplied assets.
*   **SDK**: `navi-sdk`
*   **Key Functions**:
    *   `withdraw_coin`: Removes collateral from the lending pool.

### 2. Scallop (Lending)
*   **Role**: Source of Funds.
*   **Interaction**: Similar to Navi, we redeem `sCoin` (Scallop Market Coins) for the underlying asset.
*   **SDK**: `@scallop-io/sui-scallop-sdk`
*   **Key Functions**:
    *   `Withdraw`: Redeems collateral.

### 3. Cetus (DEX Aggregator)
*   **Role**: The Engine (Middleware).
*   **Interaction**: Handles swaps when the source token doesn't match the destination requirement (e.g., migrating SUI -> SUI/USDC LP requires selling half the SUI for USDC).
*   **SDK**: `@cetusprotocol/cetus-sui-clmm-sdk`
*   **Key Functions**:
    *   `swap`: Performs the token exchange within the same PTB.

### 4. Magma Finance (Liquidity Pools)
*   **Role**: Destination (Yield Target).
*   **Interaction**: We deposit single or dual assets into Magma's CLMM pools to mint an LP position.
*   **SDK**: `@magmaprotocol/magma-clmm-sdk`
*   **Key Functions**:
    *   `add_liquidity`: Mints the LP NFT.

---

## 🧮 Transaction Builder Logic

The core logic resides in `src/lib/transaction-builder`.

```typescript
// Pseudo-code example of a Migration PTB
const tx = new Transaction();

// 1. Withdraw SUI from Navi
const [suiCoin] = tx.moveCall({
    target: '0x...navi::withdraw',
    arguments: [poolObj, amount]
});

// 2. Split SUI for LP (50/50)
const [suiForSwap] = tx.splitCoins(suiCoin, [amount / 2]);

// 3. Swap half SUI for USDC via Cetus
const [usdcCoin] = tx.moveCall({
    target: '0x...cetus::swap',
    arguments: [globalConfig, pool, suiForSwap]
});

// 4. Add Liquidity to Magma
tx.moveCall({
    target: '0x...magma::add_liquidity',
    arguments: [positionManager, suiCoin, usdcCoin]
});
```

## 🔮 Future Roadmap

*   **Smart Automation**: Implement an off-chain "Keeper" bot that monitors APY spreads and notifies users when a migration is profitable (accounting for gas + slippage).
*   **Leverage Migration**: Support migrating *debt* positions (e.g., flash loan repayment on Protocol A -> borrow on Protocol B).
*   **Cross-Chain**: Integrate Wormhole Connect to allow migrations from Solana/Ethereum directly into Sui endpoints.
