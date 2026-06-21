markdown# JoseDAO — On-Chain Governance System

![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)
![Tests](https://img.shields.io/badge/Tests-40%20passing-brightgreen)
![Network](https://img.shields.io/badge/Network-Sepolia-blue)
![License](https://img.shields.io/badge/License-MIT-green)

A production-quality DAO governance system with token-weighted voting,
quorum requirements, and timelock execution. Built with Solidity and
OpenZeppelin's `ERC20Votes`. Deployed and verified on Ethereum Sepolia.

---

## Live deployment

| | |
|---|---|
| **GovernanceToken (JGOV)** | [`0xfFEc655192F306a555C7ba353F8131391632F7F0`](https://sepolia.etherscan.io/address/0xfFEc655192F306a555C7ba353F8131391632F7F0#code) |
| **JoseDAO** | [`0x1D254B85f2c3ce683977f67aFEd6D46a2EF7c9eF`](https://sepolia.etherscan.io/address/0x1D254B85f2c3ce683977f67aFEd6D46a2EF7c9eF#code) |
| **Network** | Ethereum Sepolia Testnet |
| **Voting token standard** | ERC-20 + ERC20Votes |

---

## What this demonstrates

This project models how real DAOs like Uniswap, Compound, and MakerDAO
govern their protocols on-chain — without a CEO, board, or lawyers.
Token holders propose changes, vote proportional to their holdings,
and the contract enforces quorum and a security timelock before any
decision executes.

---

## Governance lifecycle

Create proposal   -> any token holder can propose
Voting period      -> 3 days, token-weighted (1 token = 1 vote)
Quorum check        -> requires 10% of total supply to have voted
Queue                -> succeeded proposals enter a timelock
Timelock delay      -> 1 day security buffer before execution
Execute              -> proposal is marked executed on-chain


---

## Features

| Feature | Description |
|---|---|
| **Token-weighted voting** | Voting power equals JGOV token balance at time of vote |
| **Quorum enforcement** | Minimum 10% of total supply must vote for a proposal to pass |
| **Timelock execution** | 1-day delay between queueing and execution — prevents rushed decisions |
| **Proposal cancellation** | Proposer can cancel their own proposal before voting ends |
| **On-chain history** | Every proposal, vote, and state transition is permanently recorded |
| **State machine** | Active to Succeeded/Defeated to Queued to Executed |

---

## Frontend features

- Connect wallet via MetaMask on Sepolia
- Create proposals with title and description
- Vote for/against with live quorum progress bars
- Queue and execute proposals once timelock passes
- Light/dark theme toggle with persisted preference
- Local activity history with timestamps and Etherscan links
- Live transaction confirmation banners

---

## Tech stack

- **Smart contracts** — Solidity 0.8.24
- **Framework** — Hardhat 2.22
- **Libraries** — OpenZeppelin Contracts 5.x (ERC20Votes, ERC20Permit)
- **Frontend** — React 18 + Vite + Ethers.js v6
- **Testing** — Hardhat + Chai + Ethers.js
- **Deployment** — Alchemy RPC + Hardhat
- **Verification** — Etherscan API

---

## Test coverage — 40 passing
JoseDAO Governance System

Deployment                  5 passing

Creating proposals          7 passing

Voting                     10 passing

Proposal states             4 passing

Queue and execute           8 passing

Cancel proposal             5 passing

Quorum                      1 passing
40 passing

Covers token-weighted vote accounting, quorum math, timelock enforcement,
double-voting prevention, access control, and proposal state transitions.

---

## Project structure
jose-dao/

├── contracts/

│   ├── GovernanceToken.sol

│   └── JoseDAO.sol

├── scripts/

│   └── deploy.js

├── test/

│   └── JoseDAO.test.js

├── frontend/

│   └── src/

│       ├── App.jsx

│       ├── theme.js

│       ├── hooks/

│       │   ├── useJoseDAO.js

│       │   └── useTheme.js

│       └── components/

│           ├── StatCard.jsx

│           ├── CreateProposal.jsx

│           ├── ProposalCard.jsx

│           ├── ThemeToggle.jsx

│           └── TransactionHistory.jsx

├── hardhat.config.js

└── README.md

---

## Run locally

### Prerequisites

- Node.js 22+
- MetaMask browser extension
- Alchemy account (Sepolia RPC)

### Setup

```bash
git clone https://github.com/mugwimi/jose-dao.git
cd jose-dao
npm install
```

### Create .env

```bash
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

### Run tests

```bash
npx hardhat test
```

### Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Verify on Etherscan

```bash
npx hardhat verify --network sepolia TOKEN_ADDRESS 100000
npx hardhat verify --network sepolia DAO_ADDRESS TOKEN_ADDRESS
```

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, connect MetaMask on Sepolia, and create your first proposal.

---

## Smart contract architecture
GovernanceToken

├── ERC20          (balance, transfer)

├── ERC20Permit    (gasless approvals)

└── ERC20Votes      (snapshot-based voting power)
JoseDAO

├── createProposal()    -- any holder proposes

├── castVote()           -- weighted by token balance

├── getProposalState()   -- derives Active/Succeeded/Defeated/Queued/Executed

├── queueProposal()      -- starts the timelock

├── executeProposal()    -- finalizes after timelock

└── cancelProposal()     -- proposer-only early exit

---

## Author

**Jose** — Blockchain developer
Building on Ethereum · Targeting Coinbase, Ripple, Binance.US
William Jessup University · San Jose, CA · August 2026

---

## License

MIT