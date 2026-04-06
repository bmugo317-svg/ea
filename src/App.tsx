import { useState } from 'react';
import { Gift, Wallet, Users, CheckCircle2, Copy, Share2, ExternalLink, AlertCircle, ArrowRightLeft, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

type Tab = 'home' | 'referrals' | 'withdraw';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [balance, setBalance] = useState<number>(0);
  const [tasksCompleted, setTasksCompleted] = useState<boolean>(false);
  
  // Tasks state
  const [joinedBinance, setJoinedBinance] = useState<boolean>(false);
  const [joinedSupport, setJoinedSupport] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Referral state
  const [referrals, setReferrals] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Withdraw state
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);

  const MOCK_USER_ID = "123456789";
  const REFERRAL_LINK = `https://t.me/EasterUSDTAirdropBot?start=${MOCK_USER_ID}`;

  const handleVerifyTasks = () => {
    if (!joinedBinance || !joinedSupport) {
      alert("Please join both channels first!");
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setTasksCompleted(true);
      setBalance(prev => prev + 40);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FCD535', '#ffffff', '#f472b6'] // Binance yellow, white, easter pink
      });
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateReferral = () => {
    setReferrals(prev => prev + 1);
    setBalance(prev => prev + 10);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#22c55e']
    });
  };

  const handleWithdraw = () => {
    setWithdrawError('');
    setWithdrawSuccess(false);

    if (balance < 80) {
      setWithdrawError('Minimum withdrawal is 80 USDT. Keep referring friends!');
      return;
    }

    if (!emailAddress.includes('@') || !emailAddress.includes('.')) {
      setWithdrawError('Please enter a valid email address.');
      return;
    }

    // Success logic
    setWithdrawSuccess(true);
    setBalance(0);
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FCD535', '#22c55e']
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans pb-20 max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-[#1e293b] p-4 flex items-center justify-between border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <h1 className="text-lg font-bold text-white tracking-wide">Easter USDT</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="USDT" className="w-5 h-5" />
          <span className="font-bold text-[#FCD535]">{balance}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-700 p-6 rounded-2xl flex flex-col items-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FCD535] opacity-5 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
              <p className="text-slate-400 text-sm font-medium mb-2">Your Balance</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-5xl font-black text-white">{balance}</span>
                <span className="text-xl font-bold text-[#FCD535] mb-1">USDT</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> 100% Verified Binance Airdrop
              </p>
            </div>

            {/* Tasks Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#f472b6]" /> Mandatory Tasks
              </h2>
              
              {!tasksCompleted ? (
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <p className="text-sm text-slate-300 mb-4">Complete these tasks to earn your initial <strong className="text-[#FCD535]">40 USDT</strong> reward.</p>
                    
                    <div className="space-y-3">
                      <a 
                        href="https://t.me/binanceexchange" 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={() => setTimeout(() => setJoinedBinance(true), 2000)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${joinedBinance ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FCD535]/10 flex items-center justify-center text-[#FCD535]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.31-.346-.116l-6.405 4.032-2.76-.86c-.6-.184-.614-.6.125-.89l10.793-4.16c.498-.182.936.108.775.839z"/></svg>
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">Join Binance Official</p>
                            <p className="text-xs text-slate-400">Telegram Channel</p>
                          </div>
                        </div>
                        {joinedBinance ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <ExternalLink className="w-4 h-4 text-slate-400" />}
                      </a>

                      <a 
                        href="https://t.me/BinanceSupport" 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={() => setTimeout(() => setJoinedSupport(true), 2000)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${joinedSupport ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-slate-700 hover:bg-slate-750'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FCD535]/10 flex items-center justify-center text-[#FCD535]">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.68c.223-.198-.054-.31-.346-.116l-6.405 4.032-2.76-.86c-.6-.184-.614-.6.125-.89l10.793-4.16c.498-.182.936.108.775.839z"/></svg>
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">Join Binance Support</p>
                            <p className="text-xs text-slate-400">Telegram Channel</p>
                          </div>
                        </div>
                        {joinedSupport ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <ExternalLink className="w-4 h-4 text-slate-400" />}
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/50">
                    <button 
                      onClick={handleVerifyTasks}
                      disabled={!joinedBinance || !joinedSupport || verifying}
                      className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${(!joinedBinance || !joinedSupport) ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-[#FCD535] text-slate-900 hover:bg-[#e5c02a] shadow-[0_0_15px_rgba(252,213,53,0.3)]'}`}
                    >
                      {verifying ? (
                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Verify & Claim 40 USDT"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-green-400 font-bold">Tasks Completed!</h3>
                    <p className="text-sm text-slate-300 mt-1">You received 40 USDT. Refer friends to reach the 80 USDT minimum withdrawal.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 bg-[#FCD535]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#FCD535]" />
              </div>
              <h2 className="text-2xl font-bold text-white">Invite Friends</h2>
              <p className="text-slate-400">Earn <strong className="text-[#FCD535]">10 USDT</strong> for every friend who joins through your link!</p>
            </div>

            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-5 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-medium text-slate-300">Your Statistics</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 text-center">
                  <p className="text-slate-400 text-xs mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold text-white">{referrals}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 text-center">
                  <p className="text-slate-400 text-xs mb-1">Earned (USDT)</p>
                  <p className="text-2xl font-bold text-[#FCD535]">{referrals * 10}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 pl-1">Your Referral Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 truncate select-all">
                  {REFERRAL_LINK}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-[#1e293b] border border-slate-700 p-3 rounded-xl hover:bg-slate-700 transition-colors text-white"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <button className="w-full py-3.5 bg-[#FCD535] text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#e5c02a] transition-colors mt-2">
                <Share2 className="w-5 h-5" /> Share Link
              </button>
            </div>

            {/* Developer simulation button */}
            <div className="pt-8 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center mb-3">Debug: Test referral system</p>
              <button 
                onClick={handleSimulateReferral}
                className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-750 transition-colors"
              >
                + Simulate 1 Referral (Adds 10 USDT)
              </button>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Withdraw Funds</h2>
              <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <span className="text-slate-400 text-sm">Available:</span>
                <span className="font-bold text-[#FCD535]">{balance} USDT</span>
              </div>
            </div>

            {withdrawSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-400">USDT Sent!</h3>
                  <p className="text-slate-300 text-sm mt-2">We have successfully verified and sent your USDT rewards.</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-400 break-all border border-slate-700">
                  Confirmation sent to: <span className="text-[#FCD535]">{emailAddress}</span>
                </div>
                <button 
                  onClick={() => setWithdrawSuccess(false)}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Make another withdrawal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-medium text-slate-200 mb-1">Withdrawal Rules:</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
                      <li>Minimum withdrawal amount is <strong className="text-[#FCD535]">80 USDT</strong></li>
                      <li>Enter a valid email address to receive your confirmation</li>
                      <li>Withdrawals are processed instantly after verification</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 pl-1 flex justify-between">
                    <span>Email Address</span>
                    <span className="text-xs text-[#FCD535]">Required</span>
                  </label>
                  <input 
                    type="email" 
                    placeholder="your.email@example.com" 
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-[#1e293b] border border-slate-600 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535] transition-all"
                  />
                  {withdrawError && (
                    <p className="text-red-400 text-xs px-1 flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3 h-3" /> {withdrawError}
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleWithdraw}
                  className="w-full py-4 bg-[#FCD535] text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#e5c02a] transition-all shadow-lg active:scale-[0.98]"
                >
                  <ArrowRightLeft className="w-5 h-5" /> Withdraw to Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-800 px-6 py-3 flex justify-between items-center max-w-md mx-auto z-20 pb-safe">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${activeTab === 'home' ? 'text-[#FCD535]' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Gift className={`w-6 h-6 ${activeTab === 'home' ? 'fill-[#FCD535]/20' : ''}`} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Airdrop</span>
        </button>
        <button 
          onClick={() => setActiveTab('referrals')}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${activeTab === 'referrals' ? 'text-[#FCD535]' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Users className={`w-6 h-6 ${activeTab === 'referrals' ? 'fill-[#FCD535]/20' : ''}`} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Referrals</span>
        </button>
        <button 
          onClick={() => setActiveTab('withdraw')}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${activeTab === 'withdraw' ? 'text-[#FCD535]' : 'text-slate-500 hover:text-slate-400'}`}
        >
          <Wallet className={`w-6 h-6 ${activeTab === 'withdraw' ? 'fill-[#FCD535]/20' : ''}`} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Withdraw</span>
        </button>
      </div>

      <style>{`
        .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
}

export default App;
