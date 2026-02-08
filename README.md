# CharityChain — Final Project Documentation

## 1. Overview of the Application Architecture

**CharityChain** is a decentralized crowdfunding platform built on the Ethereum blockchain.  
The system follows a **three-layer architecture**, ensuring separation of concerns, security, and maintainability.

### 1.1 Blockchain Layer (Smart Contracts)

- **CharityChain.sol** — core crowdfunding logic  
- **RewardToken.sol** — ERC-20 reward token contract  
- Deployed and managed using **Hardhat**  
- Local blockchain: **Hardhat Network (Chain ID: 31337)**

### 1.2 Application Layer (Frontend)

- Built with **HTML, CSS, and JavaScript**
- Uses **Ethers.js** to interact with smart contracts
- Runs in the browser
- Connects via **MetaMask**

### 1.3 Tooling & Infrastructure

- **Hardhat** — compilation, deployment, testing  
- **Mocha + Chai** — automated smart contract testing  
- **Node.js** — deployment scripts and local server  
- **MetaMask** — wallet management and transaction signing  

> This layered design improves **security**, **maintainability**, and **testability** by isolating responsibilities across the stack.

---

## 2. Design and Implementation Decisions

### 2.1 Choice of Blockchain Stack

**Ethereum-compatible environment** was selected due to:
- Mature tooling ecosystem  
- Wide wallet compatibility  
- Strong developer and community support  

**Hardhat** was chosen for:
- Fast local testing  
- Blockchain time manipulation (deadlines)  
- Detailed debugging and readable logs  

### 2.2 Smart Contract Design

- Logic split into **two independent contracts**:
  - Crowdfunding logic
  - Token logic  
- Improves **modularity**, **reusability**, and **security**

- Uses **OpenZeppelin** libraries:
  - `ReentrancyGuard` — protection against re-entrancy attacks  
  - `ERC20`, `Ownable` — standardized and audited implementations  

### 2.3 Security Considerations

- Re-entrancy protection on all ETH-transferring functions  
- Explicit validation for:
  - Campaign existence  
  - Deadline conditions  
  - Double refunds  
  - Unauthorized withdrawals  
- Campaign rules are **immutable after creation**

---

## 3. Smart Contract Logic Description

### 3.1 CharityChain Contract

The `CharityChain` contract manages the entire crowdfunding lifecycle.

#### Main Features

- Campaign creation with:
  - Funding goal
  - Time-based deadline
- ETH contributions from users
- Automatic reward token minting
- Campaign finalization
- Creator withdrawals
- Donor refunds for failed campaigns

#### Core Workflow

1. **Create Campaign**  
   Campaign creator defines title, funding goal, and duration  

2. **Contribute**  
   Users send ETH and receive ERC-20 reward tokens proportionally  

3. **Finalize**  
   Campaign finalized after deadline or when the goal is reached  

4. **Withdraw or Refund**
   - Successful campaign → creator withdraws funds  
   - Failed campaign → contributors claim refunds  

---

### 3.2 RewardToken Contract

The `RewardToken` contract is an ERC-20 token used to reward donors.

#### Key Properties

- **Token Name:** CharityChain Reward  
- **Symbol:** CCRT  
- **Decimals:** 18 (standard ERC-20)  
- Minting restricted to the `CharityChain` contract  

#### Tokenomics

- **1000 CCRT per 1 ETH**
- Tokens are minted **immediately upon contribution**

---

## 4. Frontend-to-Blockchain Interaction

### 4.1 Wallet Connection

- MetaMask injected provider (`window.ethereum`)
- `Ethers.js` `Web3Provider` is used
- Users sign transactions locally

### 4.2 Contract Communication

- ABI files embedded in the frontend
- Contract addresses loaded from `config.js`

**Read operations:**
- Campaign list  
- User balances  
- Campaign status  

**Write operations:**
- Create campaign  
- Contribute ETH  
- Finalize campaign  
- Withdraw or refund  

### 4.3 State Synchronization

- Frontend fetches on-chain data after each transaction  
- UI automatically updates:
  - Progress bars  
  - Campaign statuses  
  - ETH and token balances  

> This guarantees the interface always reflects the **true blockchain state**.

---

## 5. Deployment and Execution Instructions

### 5.1 Install Dependencies

```
npm install
```

### 5.2 Start Local Blockchain

```
npm run node
```

### 5.3 Deploy Smart Contracts

```
npm run deploy:local
```

**This process will:**

- Deploy both contracts

- Set CharityChain as the token minter

- Automatically generate frontend/config.js

### 5.4 Start Frontend Server

```
npm run serve
```

**Open in browser:**
```
http://localhost:5173
```

### 5.5 MetaMask Setup

- Network: Localhost 8545

- Chain ID: 31337

- Import test accounts using private keys printed by Hardhat

## 6. Obtaining Test ETH

###6.1 Hardhat Local Network

- Hardhat automatically generates pre-funded accounts 

- Each account contains 10,000 ETH

- Private keys are displayed when the node starts

### 6.2 Using Test Accounts

1. Copy a private key from the Hardhat console

2. Import it into MetaMask

3. Use ETH freely for testing campaigns

## 7. Testing and Validation

**A comprehensive test suite is provided in:**

```
test/charitychain.test.js
```

### Test Coverage

- Campaign creation

- ETH contributions and token minting

- Campaign finalization

- Withdrawals and refunds

- Access control

- Edge cases and failure scenarios

✅ All tests pass successfully, confirming correctness, security, and reliability.

## 8. Conclusion

**CharityChain demonstrates a complete decentralized application lifecycle:**

- Secure and modular smart contracts

- Token-based donor incentives

- Real blockchain interaction

- Automated testing

- User-friendly frontend

The project fulfills all technical requirements and showcases practical use of Ethereum, Solidity, Ethers.js, and Hardhat in a real-world crowdfunding scenario.
