# Porta: The Great Migration
**Submission for [Sui Hackathon Name]**

---

## 🔗 Important Links
*   **Live Demo / Website**: [https://porta-one.vercel.app]
*   **GitHub Repository**: [https://github.com/tomdan-ai/porta]
*   **Demo Video**: [https://drive.google.com/file/d/149tX4T8_zXw-Y8-c6b8-f9-f9-f9-f9-f9/view?usp=sharing]

---

## 🚀 Project Overview

**Tagline**: The Inter-Protocol Highway for Sui.

**The Problem**:
DeFi on Sui is powerful but fragmented. Users often chase high yields across different protocols (e.g., lending on Navi vs. providing liquidity on Magma). Currently, moving a position from one to the other is a painful, manual process:
1.  Withdraw from Protocol A.
2.  Sign transaction.
3.  Perform a Swap (if assets don't match).
4.  Sign transaction.
5.  Deposit into Protocol B.
6.  Sign transaction.

This results in **multiple gas fees**, **wasted time**, and **significiant friction**.

**The Solution**:
**Porta** (meaning "gateway" in Latin) is a unified migration interface. We leverage Sui's **Programmable Transaction Blocks (PTBs)** to bundle withdrawal, swapping, and depositing into a **single atomic transaction**.

**Key Benefits**:
*   **1-Click Migration**: Move from Navi/Scallop -> Magma instantly.
*   **Zero Dust**: Integrated swaps via Cetus ensure 100% of your capital moves.
*   **Gas Efficiency**: Compress 3+ transactions into 1.
*   **User Experience**: A "Lofi" aesthetic led by our Yeti mascot makes DeFi relaxing.

---

## 🛠️ Technical Architecture

Porta is a client-side orchestrator built with **Next.js 16**. We do not rely on custom smart contracts, ensuring security by interacting directly with the official SDKs of the integrated protocols.

### Stack
*   **Frontend**: Next.js 16 (App Router), Tailwind CSS 4, Framer Motion.
*   **Blockchain**: Sui Network.
*   **Visuals**: Custom generated assets (Yeti Mascot).

### The Migration Engine
The core of Porta is a Transaction Builder that constructs a specific PTB based on the user's selected route.

**Example Flow: Navi (SUI) -> Magma (SUI/USDC LP)**
1.  **Withdraw**: The PTB calls `navi::withdraw` to remove SUI collateral.
2.  **Split & Swap**: The PTB calculates the 50/50 split required for the LP. It calls `cetus::swap` to convert half the SUI to USDC.
3.  **Deposit**: The PTB calls `magma::add_liquidity` with the SUI and USDC to mint a new LP position.

All of this happens in **one block**.

---

## 🔌 Integrations
We are proud to integrate the following ecosystem partners:

| Protocol | Type | Usage in Porta |
| :--- | :--- | :--- |
| **Navi Protocol** | Lending | Source of funds (withdrawals). |
| **Scallop** | Lending | Source of funds (withdrawals). |
| **Cetus** | DEX | The swap engine for asset conversion. |
| **Magma Finance** | LP | The destination for high-yield migrations. |

---

## 🔮 Future Roadmap
*   **Q2 2026**: "Keeper" bots to auto-migrate users based on APY thresholds.
*   **Q3 2026**: Cross-chain support (Solana -> Sui) via Wormhole.
*   **Q4 2026**: Mobile App launch.

---

## 👥 Team
*   **[Your Name]**: Full Stack Developer / Blockchain Engineer.
*   **[Teammate Name]**: Designer / Frontend.

---

*Verified & Built on Sui.*
