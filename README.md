# Porta: The Great Migration ❄️

> **The Inter-Protocol Highway for Sui.**
> 
> *Move liquidity across protocols with a single click. Save gas, save time, stay in the Lofi zone.*

## 🏔️ The Problem
DeFi on Sui is powerful but fragmented. Moving your position from a lending protocol (like Navi) to a high-yield LP (like Magma) is a chore:
1. Withdraw from Navi.
2. Sign.
3. Swap half to USDC.
4. Sign.
5. Deposit into Magma.
6. Sign.

That's **3 signatures** and **3 gas fees**.

## 🚀 The Solution: Porta
**Porta** (gateway in Latin) acts as a unified interface for cross-protocol migrations. By leveraging Sui's **Programmable Transaction Blocks (PTBs)**, we bundle every step into a single atomic transaction.

**One Click. One Signature. Zero Hassle.**

## ✨ Features

### 1-Click Migration
Instantly move funds between major Sui protocols:
- **Navi Protocol** (Source: Lending)
- **Scallop** (Source: Lending)
- **Magma Finance** (Destination: LP)

### The "Yeti" Dashboard
Experience a custom "Lofi" aesthetic designed for relaxation. Watch our mascot, the **Yeti**, physically carry your assets from one protocol to another as the transaction executes.

### Gas Calculator
See exactly how much you're saving compared to other chains.
> *"On Ethereum, this would cost $85. On Sui, you just paid $0.004."*

### Integrated Swaps via Cetus
Need to zap from single-asset stability to a dual-asset LP? Porta automatically handles the swap mid-flight using **Cetus Aggregator**, ensuring you get the best rates without leaving the app.

## 🛠️ Technology Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Blockchain**: [Sui Network](https://sui.io/)
- **Wallet Auth**: zkLogin & Sui Wallet (via `@mysten/dapp-kit`)
- **Move Integration**:
  - `@naviprotocol/lending-sdk`
  - `@scallop-io/sui-scallop-sdk`
  - `@magmaprotocol/magma-clmm-sdk`
  - `@cetusprotocol/cetus-sui-clmm-sdk`
- **Styling**: Tailwind CSS 4.0 + Framer Motion

## ⚡ Getting Started

### Prerequisites
- Node.js 20+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/porta.git
cd porta

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start migrating!

## 🗺️ Roadmap
- [x] Navi -> Magma Migration
- [x] Scallop -> Magma Migration
- [ ] Auto-Compounding Vaults
- [ ] Cross-Chain "Portals" via Wormhole

## 📄 License
MIT
