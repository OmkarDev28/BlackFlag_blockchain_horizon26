# BharatSettlement Layer: Blockchain-based T+0 Securities Settlement

**Project for Horizon 1.0 - Vidyavardhini’s College of Engineering and Technology**

## 📌 Problem Statement
Indian stock markets currently operate on **T+1 settlement**, locking up over **₹6 lakh crore daily** in clearing corporations. This creates counterparty risk, high margin requirements, and frozen capital for 24 hours.

## 🚀 The Solution
The **BharatSettlement Layer** is a blockchain-based protocol that enables **Atomic Delivery vs. Payment (DvP)**. It reduces settlement time from 24 hours (T+1) to **under 5 seconds (T+0)** using smart contracts.

---

## 🏗️ Architecture
- **Solidity Smart Contracts:** 
  - `INR.sol`: Digital Rupee (ERC20) for instant payments.
  - `SecurityToken.sol`: Tokenized Equity Shares (ERC20).
  - `AtomicSettlement.sol`: The DvP engine for simultaneous swaps.
- **Node.js/Express Backend:** Acts as the Clearing Corporation interface & UPI/RTGS bridge.
- **React Frontend:** Real-time dashboard for traders and settlement monitoring.

---

## ⚙️ How It Works (The Atomic Flow)
1. **Tokenization:** Fiat (INR) and Securities (Reliance/TCS) are tokenized on-chain.
2. **Matching:** The system matches a Buyer and Seller.
3. **Atomic Swap:** The `AtomicSettlement` contract executes a **single transaction** that transfers shares to the buyer and money to the seller simultaneously.
4. **Reversion Safety:** If either party lacks the assets, the transaction fails completely, ensuring **Zero Counterparty Risk**.

---

## 📊 Cost-Benefit Analysis: T+1 vs. T+0

| Feature | Traditional (T+1) | BharatSettlement (T+0) |
|---------|-------------------|------------------------|
| **Settlement Time** | 24 - 48 Hours | < 5 Seconds |
| **Counterparty Risk** | High (24h window) | **Zero** (Atomic) |
| **Capital Efficiency** | Locked for 1 day | **100% Instant Reuse** |
| **Daily Frozen Capital** | ₹6,00,000 Crore | ₹0 (Unlocked) |
| **Margin Requirements** | High (to cover risk) | Significant Reduction |
| **Intermediary Costs** | Multiple layers | Peer-to-Peer / Direct |

---

## 🛠️ Setup & Installation

### 1. Blockchain (Hardhat)
```bash
cd blockchain
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Backend (Express)
```bash
cd backend
npm install
node index.js
```

### 3. Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

## Integration with Indian Rails
- **UPI/RTGS Bridge:** Our system uses a backend oracle to listen for UPI/RTGS incoming payments. Once verified, it automatically mints `Digital INR` to the user's wallet, enabling a seamless transition from traditional banking to blockchain settlement.
- **SEBI Compliance:** The `AtomicSettlement` contract includes an `onlyOwner` modifier for the `settle` function, ensuring only SEBI-authorized Clearing Corporations can trigger the final swap.

---
