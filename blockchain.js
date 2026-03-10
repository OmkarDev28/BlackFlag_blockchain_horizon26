const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Written by deploy.js after you run: npx hardhat run scripts/deploy.js --network localhost
const deployment = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../deployment.json'), 'utf8')
);
const ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../abis/DVPSettlement.json'), 'utf8')
);

// Connect to local Hardhat node
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// Hardhat test wallet — clearing corp (only one allowed to call contract functions)
const wallet = new ethers.Wallet(
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  provider
);

// Test buyer and seller wallets
const buyerWallet = new ethers.Wallet(
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  provider
);
const sellerWallet = new ethers.Wallet(
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926b',
  provider
);

// writableContract  → send transactions (costs gas, changes state)
const writableContract = new ethers.Contract(
  deployment.contractAddress,
  ABI,
  wallet
);

// readableContract  → read data (free, no gas, no wallet needed)
const readableContract = new ethers.Contract(
  deployment.contractAddress,
  ABI,
  provider
);

const STATUS = { 0: 'PENDING', 1: 'LOCKED', 2: 'SETTLED', 3: 'FAILED' };

function formatTrade(raw) {
  return {
    tradeId: raw.tradeId,
    buyer: raw.buyer,
    seller: raw.seller,
    stockSymbol: raw.stockSymbol,
    quantity: Number(raw.quantity),
    pricePerShareINR: Number(raw.pricePerShare) / 100,
    totalAmountINR: Number(raw.totalAmount) / 100,
    status: STATUS[Number(raw.status)] ?? 'UNKNOWN',
    createdAt: new Date(Number(raw.createdAt) * 1000).toISOString(),
    settledAt:
      Number(raw.settledAt) > 0
        ? new Date(Number(raw.settledAt) * 1000).toISOString()
        : null,
  };
}

module.exports = {
  provider,
  wallet,
  buyerWallet,
  sellerWallet,
  writableContract,
  readableContract,
  deployment,
  formatTrade,
};
