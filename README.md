CharityChain — Final Project Documentation

1. Overview of the Application Architecture

CharityChain is a decentralized crowdfunding platform built on the Ethereum blockchain.
The system follows a three-layer architecture:

1.1 Blockchain Layer (Smart Contracts)

CharityChain.sol — core crowdfunding logic

RewardToken.sol — ERC-20 reward token contract

Deployed and managed using Hardhat

Local blockchain: Hardhat Network (Chain ID: 31337)

1.2 Application Layer (Frontend)

Built with HTML, CSS, and JavaScript

Uses Ethers.js to communicate with the blockchain

Runs in the browser and connects via MetaMask

1.3 Tooling & Infrastructure

Hardhat — compilation, deployment, testing

Mocha + Chai — automated smart contract testing

Node.js — deployment scripts and local server

MetaMask — wallet and transaction signing

This layered design ensures clear separation of concerns, improving security, maintainability, and testability.

2. Design and Implementation Decisions

2.1 Choice of Blockchain Stack

- Ethereum-compatible environment chosen due to:

Mature tooling

Wide wallet support

Strong developer ecosystem

- Hardhat selected for:

Fast local testing

Time manipulation (for deadlines)

Detailed debugging and logs

2.2 Smart Contract Design

- Logic split into two contracts:

Crowdfunding logic isolated from token logic

Improves modularity and security

- Uses OpenZeppelin libraries:

ReentrancyGuard — protection against re-entrancy attacks

ERC20 and Ownable — standardized token implementation

2.3 Security Considerations

- Re-entrancy protection on all ETH-transferring functions

- Explicit checks for:

Campaign existence

Deadline validation

Double refunds

Unauthorized withdrawals

- Immutable campaign rules once created

3. Smart Contract Logic Description

3.1 CharityChain Contract

The CharityChain contract manages all crowdfunding functionality.

- Main Features:

Campaign creation with: Funding goal, Time-based deadline

ETH contributions from users

Automatic reward token minting

Campaign finalization

Creator withdrawals

Donor refunds for failed campaigns

- Core Workflow:

1. Create Campaign

Creator defines title, goal, and duration

2. Contribute

Users send ETH

Receive ERC-20 reward tokens proportionally

3. Finalize

Campaign finalized after deadline or goal reached

4. Withdraw or Refund

Successful → creator withdraws funds

Failed → contributors claim refunds

3.2 RewardToken Contract

The RewardToken contract is an ERC-20 token used to reward donors.

- Key Properties:

Token Name: CharityChain Reward

Symbol: CCRT

Minting restricted to CharityChain contract

Uses 18 decimals (standard ERC-20)

- Tokenomics:

1000 CCRT tokens per 1 ETH

Tokens minted immediately upon contribution

4. Frontend-to-Blockchain Interaction

4.1 Wallet Connection

MetaMask injected provider (window.ethereum)

Ethers.js Web3Provider used

User signs transactions locally

4.2 Contract Communication

ABI files embedded in frontend

Contract addresses loaded from config.js

Read operations: Campaign list, User balances, Campaign status

Write operations: Create campaign, Contribute ETH, Finalize campaign, Withdraw or refund

4.3 State Synchronization

Frontend fetches on-chain data after each transaction

- UI automatically updates:

Progress bars

Campaign status

Token and ETH balances

This ensures the interface always reflects true blockchain state.

5. Deployment and Execution Instructions

5.1 Install Dependencies
npm install

5.2 Start Local Blockchain
npm run node

5.3 Deploy Smart Contracts
npm run deploy:local

This will deploy both contracts, Set CharityChain as token minter, Generate frontend/config.js automatically

5.4 Start Frontend Server
npm run serve

Open in browser:

http://localhost:5173

5.5 MetaMask Setup

Network: Localhost 8545

Chain ID: 31337

Import a test account using private keys printed by Hardhat

6. Obtaining Test ETH

6.1 Hardhat Local Network

Hardhat automatically provides pre-funded accounts

Each account contains 10,000 ETH

Private keys are shown when the node starts

6.2 Using Test Accounts

Copy a private key from Hardhat console

Import into MetaMask

Use ETH freely for testing campaigns

7. Testing and Validation

Comprehensive test suite included in test/charitychain.test.js

- Tests cover:

Campaign creation

Contributions and token minting

Finalization logic

Withdrawals and refunds

Access control

Edge cases and failure scenarios

All tests pass successfully, confirming contract correctness and security.

8. Conclusion

CharityChain demonstrates a complete decentralized application lifecycle:

Secure smart contracts

Token-based incentives

Real blockchain interaction

Automated testing

User-friendly frontend

The project fulfills all technical requirements and showcases practical application of Ethereum, Solidity, Ethers.js, and Hardhat in a real-world crowdfunding use case.
