const router = require('express').Router();
const {
  provider,
  buyerWallet,
  sellerWallet,
  writableContract,
  readableContract,
  deployment,
  formatTrade,
} = require('../config/blockchain');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — parse a named event out of a transaction receipt
// ─────────────────────────────────────────────────────────────────────────────
function parseEvent(receipt, eventName) {
  for (const log of receipt.logs) {
    try {
      const parsed = writableContract.interface.parseLog(log);
      if (parsed?.name === eventName) return parsed;
    } catch {
      /* skip */
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// Is the server alive?
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health/chain
// Is the blockchain node reachable?
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health/chain', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({
      status: 'ok',
      blockNumber,
      contractAddress: deployment.contractAddress,
    });
  } catch (err) {
    res
      .status(503)
      .json({
        status: 'error',
        error: 'Blockchain node unreachable. Run: npx hardhat node',
      });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /stats
// System-wide settlement stats — read directly from the smart contract
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [onChain, blockNumber] = await Promise.all([
      readableContract.getStats(), // returns [totalSettled, capitalINR, capitalPaise]
      provider.getBlockNumber(),
    ]);

    res.json({
      success: true,
      totalTradesSettled: Number(onChain[0]),
      capitalSettledINR: Number(onChain[1]),
      currentBlock: blockNumber,
      contractAddress: deployment.contractAddress,
      T1CapitalLockedCrore: 600000, // ₹6 lakh crore locked daily in T+1
      capitalLockedINR: 0, // our system — always zero
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /trades
// Submit a trade for atomic DVP settlement
//
// Body: { stockSymbol, quantity, pricePerShare }
// pricePerShare is in PAISE — ₹2850 = 285000
// ─────────────────────────────────────────────────────────────────────────────
router.post('/trades', async (req, res) => {
  const { stockSymbol, quantity, pricePerShare } = req.body;

  // Basic validation
  if (!stockSymbol || !quantity || !pricePerShare) {
    return res.status(400).json({
      success: false,
      error:
        'Required: stockSymbol (string), quantity (number), pricePerShare (number in paise)',
    });
  }

  const logs = [];
  const startTime = Date.now();
  const log = (msg, type = 'info') => {
    logs.push({ time: new Date().toISOString(), msg, type });
    console.log(msg);
  };

  try {
    const totalAmount = quantity * pricePerShare;
    log(`New trade → ${quantity} × ${stockSymbol} @ ₹${pricePerShare / 100}`);

    // ── STEP 1: createTrade ───────────────────────────────────────────────────
    // Sends a transaction to the blockchain — creates a trade record on-chain
    log('Step 1/4 — Creating trade on blockchain...');
    const createTx = await writableContract.createTrade(
      buyerWallet.address, // buyer wallet address
      sellerWallet.address, // seller wallet address
      stockSymbol,
      quantity,
      pricePerShare
    );
    const createReceipt = await createTx.wait(); // wait for block confirmation
    const tradeEvent = parseEvent(createReceipt, 'TradeCreated');
    const tradeId = tradeEvent.args.tradeId;
    const tradeTs = tradeEvent.args.timestamp;
    log(`Step 1/4 — Done. Block #${createReceipt.blockNumber}`, 'success');

    // ── STEP 2: Mock UPI ──────────────────────────────────────────────────────
    // In production: call NPCI UPI API here
    log('Step 2/4 — Verifying UPI mandate...');
    await new Promise((r) => setTimeout(r, 800)); // simulate UPI round-trip
    log('Step 2/4 — UPI cleared ✓', 'success');

    // ── STEP 3: lockAssets ────────────────────────────────────────────────────
    // Locks buyer's funds + seller's shares in the smart contract escrow
    log('Step 3/4 — Locking assets in escrow...');
    const lockTx = await writableContract.lockAssets(
      tradeId,
      totalAmount,
      quantity
    );
    await lockTx.wait();
    log('Step 3/4 — Assets locked ✓', 'success');

    // ── STEP 4: atomicSettle ──────────────────────────────────────────────────
    // THE SWAP — shares go to buyer, payment goes to seller, in ONE transaction
    log('Step 4/4 — Firing atomic DVP swap...');
    const settleTx = await writableContract.atomicSettle(tradeId, tradeTs);
    const settleReceipt = await settleTx.wait();
    const settlementMs = Date.now() - startTime;
    log(`Step 4/4 — ATOMIC SWAP COMPLETE in ${settlementMs}ms ✓`, 'success');

    // ── Read final state from chain ───────────────────────────────────────────
    const trade = await readableContract.getTrade(tradeId);

    res.json({
      success: true,
      tradeId,
      txHash: settleTx.hash,
      blockNumber: settleReceipt.blockNumber,
      settlementTimeMs: settlementMs,
      trade: formatTrade(trade),
      logs,
    });
  } catch (err) {
    log(`Failed: ${err.message}`, 'error');
    res.status(500).json({ success: false, error: err.message, logs });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /trades
// Get all trades from the blockchain
// ─────────────────────────────────────────────────────────────────────────────
router.get('/trades', async (req, res) => {
  try {
    const ids = await readableContract.getAllTradeIds();
    const raws = await Promise.all(
      ids.map((id) => readableContract.getTrade(id))
    );
    const trades = raws.map(formatTrade).reverse(); // newest first

    res.json({ success: true, count: trades.length, trades });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /trades/:tradeId
// Get one trade by its blockchain ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/trades/:tradeId', async (req, res) => {
  try {
    const raw = await readableContract.getTrade(req.params.tradeId);

    if (Number(raw.createdAt) === 0) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    res.json({ success: true, trade: formatTrade(raw) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /simulate
// Quick demo — fire a preset trade without building a full request body
// Body: { scenario: "reliance" | "tcs" | "infy" | "random" }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/simulate', async (req, res) => {
  const PRESETS = {
    reliance: {
      stockSymbol: 'RELIANCE.NS',
      quantity: 100,
      pricePerShare: 285000,
    },
    tcs: { stockSymbol: 'TCS.NS', quantity: 50, pricePerShare: 385000 },
    infy: { stockSymbol: 'INFY.NS', quantity: 200, pricePerShare: 178000 },
    hdfcbank: {
      stockSymbol: 'HDFCBANK.NS',
      quantity: 150,
      pricePerShare: 165000,
    },
  };

  const key = req.body?.scenario || 'reliance';

  let params;
  if (key === 'random') {
    const keys = Object.keys(PRESETS);
    params = PRESETS[keys[Math.floor(Math.random() * keys.length)]];
  } else if (PRESETS[key]) {
    params = PRESETS[key];
  } else {
    return res
      .status(400)
      .json({
        success: false,
        error: `Unknown scenario. Use: ${Object.keys(PRESETS).join(
          ', '
        )}, random`,
      });
  }

  // Reuse the POST /trades logic by forwarding to the same handler
  req.body = params;
  return router.handle(
    { ...req, url: '/trades', method: 'POST', body: params },
    res,
    () => {}
  );
});

module.exports = router;
