import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, ShieldCheck, Wallet, ArrowRightLeft, TrendingUp, 
  Info, Cpu, BarChart3, Clock, Zap, CheckCircle2, AlertTriangle
} from 'lucide-react';

const API_BASE = "http://localhost:5001";
const RELIANCE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const TRADERS = [
  { name: "Retail Trader", role: "Buyer", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { name: "Institutional Fund", role: "Seller", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", color: "text-brand-accent", bg: "bg-brand-accent/10" },
  { name: "Clearing Corp", role: "Admin", address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", color: "text-brand-green", bg: "bg-brand-green/10" }
];

function App() {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'info', message: "System Ready: Awaiting trade execution." });
  const [tradeDetails, setTradeDetails] = useState({ amount: 10, price: 2500 });

  useEffect(() => {
    refreshBalances();
    const interval = setInterval(refreshBalances, 5000); // Poll balances
    return () => clearInterval(interval);
  }, []);

  const refreshBalances = async () => {
    const newBalances = {};
    for (const trader of TRADERS) {
      try {
        const res = await axios.get(`${API_BASE}/balances/${trader.address}`);
        newBalances[trader.address] = res.data;
      } catch (err) {
        console.error("Balance fetch error", err);
      }
    }
    setBalances(newBalances);
  };

  const handleAction = async (actionFn, loadingMsg, successMsg) => {
    setLoading(true);
    setStatus({ type: 'info', message: loadingMsg });
    try {
      await actionFn();
      await refreshBalances();
      setStatus({ type: 'success', message: successMsg });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  const handleDeposit = (address, amount) => 
    handleAction(
      () => axios.post(`${API_BASE}/fiat-deposit`, { address, amount }),
      "Bridging UPI to Blockchain (Minting INR)...",
      `Successfully minted ₹${amount} INR on-chain.`
    );

  const handleMintSecurities = (address, amount) => 
    handleAction(
      () => axios.post(`${API_BASE}/mint-securities`, { address, amount }),
      "Tokenizing Demat Shares (Minting RELIANCE)...",
      `Successfully tokenized ${amount} RELIANCE shares.`
    );

  const handleSettle = () => {
    const seller = TRADERS[1].address;
    const buyer = TRADERS[0].address;
    const totalPrice = tradeDetails.amount * tradeDetails.price;

    handleAction(
      () => axios.post(`${API_BASE}/settle`, { seller, buyer, security: RELIANCE_ADDRESS, amount: tradeDetails.amount, price: totalPrice }),
      "Initiating Atomic Swap (DvP)...",
      "T+0 SETTLEMENT SUCCESS: Shares and Cash swapped simultaneously in <2s."
    );
  };

  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(Number(num) || 0);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="flex items-center gap-4 z-10">
            <div className="p-3 bg-brand-blue/20 rounded-xl border border-brand-blue/30">
              <ShieldCheck size={32} className="text-brand-blue" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                BharatSettlement Layer
              </h1>
              <p className="text-brand-cyan/80 font-mono text-sm mt-1 flex items-center gap-2">
                <Zap size={14} /> Atomic T+0 DvP Protocol
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-dark-900/80 px-4 py-2 rounded-full border border-white/5 z-10 shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
            </span>
            <span className="text-sm font-medium text-slate-300">SEBI Sandbox Node</span>
            <span className="text-xs text-slate-500 font-mono ml-2 border-l border-white/10 pl-2">Latency: 45ms</span>
          </div>
        </header>

        {/* Status Bar */}
        <div className={`glass-panel p-4 flex items-center gap-4 transition-all duration-500 ${
          status.type === 'error' ? 'border-red-500/30 bg-red-500/5' : 
          status.type === 'success' ? 'border-brand-green/30 bg-brand-green/5' : 
          'border-brand-blue/30 bg-brand-blue/5'
        }`}>
          {loading ? <Activity className="text-brand-blue animate-spin" /> : 
           status.type === 'error' ? <AlertTriangle className="text-red-400" /> :
           status.type === 'success' ? <CheckCircle2 className="text-brand-green" /> :
           <Info className="text-brand-blue" />}
          <p className={`font-mono text-sm flex-1 ${
            status.type === 'error' ? 'text-red-300' : 
            status.type === 'success' ? 'text-brand-green' : 
            'text-brand-blue'
          }`}>
            {status.message}
          </p>
        </div>

        {/* Network Participants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRADERS.map((trader) => (
            <div key={trader.address} className="glass-card p-6 flex flex-col h-full relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Wallet size={18} className={trader.color} /> {trader.name}
                  </h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${trader.bg} ${trader.color}`}>
                    {trader.role}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="bg-dark-900/60 p-3 rounded-lg border border-white/5 flex justify-between items-center group-hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-lg font-mono">₹</span> INR
                  </div>
                  <span className="font-mono font-bold text-lg text-white">
                    {formatNumber(balances[trader.address]?.inr)}
                  </span>
                </div>
                <div className="bg-dark-900/60 p-3 rounded-lg border border-white/5 flex justify-between items-center group-hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 text-slate-400">
                    <BarChart3 size={16} /> RELIANCE
                  </div>
                  <span className="font-mono font-bold text-lg text-white">
                    {balances[trader.address]?.reliance || "0"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button 
                  onClick={() => handleDeposit(trader.address, 100000)}
                  disabled={loading}
                  className="btn-secondary text-sm flex justify-center items-center gap-1"
                >
                  Deposit ₹1L
                </button>
                <button 
                  onClick={() => handleMintSecurities(trader.address, 50)}
                  disabled={loading}
                  className="btn-secondary text-sm flex justify-center items-center gap-1"
                >
                  Mint 50 Sh.
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Engine & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <Cpu className="text-brand-accent" /> Algorithmic Matching & Execution
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Asset Pair</label>
                <input value="RELIANCE / INR" disabled className="input-field opacity-70 cursor-not-allowed bg-dark-800" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Quantity (Shares)</label>
                <input 
                  type="number" 
                  value={tradeDetails.amount} 
                  onChange={(e) => setTradeDetails({...tradeDetails, amount: e.target.value})}
                  className="input-field text-xl" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Execution Price (₹)</label>
                <input 
                  type="number" 
                  value={tradeDetails.price} 
                  onChange={(e) => setTradeDetails({...tradeDetails, price: e.target.value})}
                  className="input-field text-xl text-brand-green" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/10 pt-8 mt-4">
              <div className="text-slate-400 text-sm">
                Total Transaction Value: <span className="text-xl font-bold text-white font-mono ml-2">₹{formatNumber(tradeDetails.amount * tradeDetails.price)}</span>
              </div>
              <button 
                onClick={handleSettle}
                disabled={loading}
                className="btn-primary w-full sm:w-auto text-lg py-4 px-12 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>Processing <Activity className="animate-spin" size={20}/></>
                ) : (
                  <>Execute Atomic Swap <ArrowRightLeft className="group-hover:rotate-180 transition-transform duration-500" size={20}/></>
                )}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 bg-gradient-to-b from-dark-800/80 to-dark-900/80">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-brand-cyan" size={20} /> Impact Analysis
            </h2>
            
            <div className="space-y-5">
              <div className="bg-dark-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-brand-blue/30 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue"></div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Clock size={12}/> Settlement Speed</p>
                <div className="flex justify-between items-end">
                  <div className="line-through text-slate-600 font-mono text-sm">T+1 (24 Hrs)</div>
                  <div className="text-brand-blue font-bold text-lg font-mono">&lt; 2 Seconds</div>
                </div>
              </div>
              
              <div className="bg-dark-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-brand-green/30 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green"></div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><Zap size={12}/> Capital Efficiency</p>
                <div className="text-brand-green font-bold text-lg">100% Instantly Freed</div>
                <p className="text-xs text-slate-500 mt-1">Solves the ₹6L Cr frozen capital issue.</p>
              </div>

              <div className="bg-dark-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-brand-accent/30 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-accent"></div>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Counterparty Risk</p>
                <div className="text-brand-accent font-bold text-lg">Mathematically Zero</div>
                <p className="text-xs text-slate-500 mt-1">DvP ensures assets swap simultaneously.</p>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="text-center text-slate-600 text-sm font-mono py-4 border-t border-white/5">
          Built for Horizon 1.0 • Vidyavardhini’s College of Engineering and Technology
        </footer>
      </div>
    </div>
  );
}

export default App;
