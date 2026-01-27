
PRD: Porta (The Great Migration)
1. Project Vision
Goal: Create an "Inter-Protocol Highway" for Sui.
The "Why": Currently, moving $1,000$ from Navi to Magma takes 3-4 manual steps. YetiPorter reduces this to one click using Sui's Programmable Transaction Blocks (PTBs), saving the user gas, time, and slippage.

2. Updated Adoption Strategy (Target Protocols)
We are focusing on the highest TVL pools to ensure immediate utility for the most users.
Priority
Protocol
Role in MVP
High
Navi Protocol
The "Source" (Most users have $SUI$ or $USDC$ supplied here).
High
Scallop
The "Alternative" (Users chase interest rates between Navi and Scallop).
High
Magma Finance
The "Yield Target" (High-yield adaptive liquidity pools).
Utility
Cetus
The "Engine" (Handles any necessary swaps mid-transaction).


3. The Winning MVP Workflow
The "Featured Route": Port from Navi (Lending) $\rightarrow$ Magma (LP).
Selection: User sees their Navi $SUI$ position ($2.5\%$ APY) and compares it to Magma's $SUI/USDC$ LP ($15\%$ APY).
Orchestration: User clicks "Migrate to Magma."
The PTB (Under the hood):
navi::withdraw_coin: Pulls $SUI$ out of Navi.
cetus::swap: (Optional) Swaps half the $SUI$ for $USDC$.
magma::add_liquidity: Deposits the pair into Magma.
Completion: The user signs once. Their Navi balance drops, and their Magma LP NFT appears.

4. Technical Implementation Details
Framework: Next.js (App Router)
Why: Best for handling zkLogin redirects and providing a "Production Ready" feel for judges.
Styling: Tailwind CSS + Framer Motion (for "Lofi" Yeti animations).
Core Engine: TypeScript SDK
You will not write a Move contract. You will build a Transaction Builder class.
TypeScript
// Example Logic for Navi -> Scallop Move
const tx = new Transaction();

// 1. Withdraw from Navi
// Using @naviprotocol/lending SDK or raw moveCall
const [withdrawnCoin] = tx.moveCall({
  target: `${NAVI_ID}::lending::withdraw`,
  arguments: [tx.object(SUI_POOL), tx.pure.u64(amount)]
});

// 2. Deposit into Scallop
tx.moveCall({
  target: `${SCALLOP_ID}::lending::deposit`,
  arguments: [tx.object(SCALLOP_MARKET), withdrawnCoin]
});

// One signature, two protocols.


5. Hackathon "X-Factors" (How to Win)
The "Yeti" Dashboard: Use a dark, "Lofi" aesthetic. When a migration happens, show a Yeti character physically moving a chest from one logo to another using Framer Motion.
Gas Calculator: Show a "Sui vs. Others" comparison. "On Ethereum, this would cost $85. On Sui, you just paid $0.004."
zkLogin: Allow users to log in with Google. This is a massive "Onboarding" bonus point from the Sui Foundation.

6. Project Checklist
[ ] Setup: npx create-next-app + @mysten/sui + @mysten/dapp-kit.
[ ] Discovery: Write a function to fetch user's OwnedObjects and filter for Navi/Scallop receipt tokens.
[ ] Construction: Build the PTB that chains a Withdraw and a Deposit.
[ ] Frontend: Build a "Migration Card" component.
[ ] Demo: Record a video showing a 1-click move from Navi to Magma.

