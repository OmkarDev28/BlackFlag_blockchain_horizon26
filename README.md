**SEBI Real-Time Settlement Layer (T+0 DVP)**

LINK: <https://362ydk.csb.app/>

A blockchain-powered Delivery vs. Payment (DVP) system enabling atomic, real-time settlement for Indian equity markets.

**Description & The Problem It Solves**

In the current Indian Stock Market, millions of trades are executed daily. However, while funds are locked instantly, the actual transfer of shares takes a full business day (T+1 settlement). This creates systemic risk and traps thousands of crores in a "waiting room" clearinghouse.

**Our Solution:** We built a "Black Box" (Blockchain Smart Contract) that enforces strict Delivery versus Payment (DVP). The system guarantees that fiat (Digital INR) and securities (Company Shares) are swapped at the exact same few seconds. If either party defaults, the transaction mathematically reverts. No middleman, no T+1 delays, zero counterparty risk.


**Installation & Setup**     

Follow these exact steps to run the local blockchain "Rules-Logic" and the API "Middle-man". This setup prioritizes "DVP" and gets you running in minutes.

Prerequisites: Node.js (v18+) and npm installed.

1. Clone the repository & install dependencies

git clone <https://github.com/OmkarDev28/BlackFlag_blockchain_horizon26>
  
mkdir sebi-realtime-settlement

cd sebi-realtime-settlement

npm install --save-dev hardhat

npm install express cors ethers hardhat @openzeppelin/contracts

2. Node & Hardhat Project
   
npm init -y
  
npx hardhat init



**Tech Stack**

Smart Contracts: Solidity, Hardhat Local Node         
Backend API: Node.js, Express.js, Ethers.js (v6)       
Frontend UI: React-vite, JavaScript (Fetch API)        

