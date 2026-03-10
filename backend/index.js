require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

// ABIs
const INR_ABI = require('./abis/INR.json').abi;
const SECURITY_TOKEN_ABI = require('./abis/SecurityToken.json').abi;
const SETTLEMENT_ABI = require('./abis/AtomicSettlement.json').abi;

const app = express();
app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contracts
const inrContract = new ethers.Contract(process.env.INR_ADDRESS, INR_ABI, wallet);
const settlementContract = new ethers.Contract(process.env.SETTLEMENT_ADDRESS, SETTLEMENT_ABI, wallet);
const relianceContract = new ethers.Contract(process.env.RELIANCE_ADDRESS, SECURITY_TOKEN_ABI, wallet);

app.get('/balances/:address', async (req, res) => {
    try {
        const address = req.params.address;
        const inrBalance = await inrContract.balanceOf(address);
        const relianceBalance = await relianceContract.balanceOf(address);
        
        res.json({
            inr: ethers.formatUnits(inrBalance, 18), // assuming 18 decimals
            reliance: relianceBalance.toString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/fiat-deposit', async (req, res) => {
    try {
        const { address, amount } = req.body;
        const tx = await inrContract.mint(address, ethers.parseUnits(amount.toString(), 18));
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/mint-securities', async (req, res) => {
    try {
        const { address, amount } = req.body;
        const tx = await relianceContract.mint(address, amount);
        await tx.wait();
        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// For simplicity, this endpoint handles the approvals (simulated) 
// and triggers the settlement. In reality, approvals happen client-side.
app.post('/settle', async (req, res) => {
    try {
        const { seller, buyer, security, amount, price } = req.body;
        
        // In a real T+0 demo, we'd assume approvals are already done.
        // For the demo to work without Metamask prompts every time, 
        // we'll use our server wallet (clearing corp) which has permissions.
        // But the settle function REQUIRES transferFrom, so buyer/seller MUST approve.
        
        // This is the atomic call
        const tx = await settlementContract.settle(seller, buyer, security, amount, ethers.parseUnits(price.toString(), 18));
        await tx.wait();
        
        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
