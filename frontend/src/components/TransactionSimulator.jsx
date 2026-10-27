import React, { useState } from 'react';
import { Send, AlertTriangle, ShieldCheck, RefreshCw, Zap } from 'lucide-react';

export default function TransactionSimulator({ accounts, onTransactionEvaluated }) {
  const [sourceAcc, setSourceAcc] = useState('');
  const [targetAcc, setTargetAcc] = useState('');
  const [amount, setAmount] = useState('250.00');
  const [deviceId, setDeviceId] = useState('DEV_MOBILE_01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Set initial accounts when loaded
  React.useEffect(() => {
    if (accounts && accounts.length >= 2 && !sourceAcc) {
      setSourceAcc(accounts[0].account_id);
      setTargetAcc(accounts[1].account_id);
    }
  }, [accounts]);

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    if (!sourceAcc || !targetAcc || sourceAcc === targetAcc) {
      alert("Please select distinct source and target accounts.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/transactions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_account_id: sourceAcc,
          target_account_id: targetAcc,
          amount: parseFloat(amount),
          channel: 'P2P_MOBILE',
          device_id: deviceId,
          ip_address: '192.168.1.105'
        })
      });
      const data = await res.json();
      setEvaluationResult(data);
      if (onTransactionEvaluated) {
        onTransactionEvaluated(data);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Failed to evaluate transaction. Ensure backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-configured Fraud Scenarios for Judges & Viva
  const loadScenario = (type) => {
    if (type === 'LEGIT') {
      setSourceAcc('ACC_NORM_001');
      setTargetAcc('ACC_NORM_002');
      setAmount('45.00');
      setDeviceId('DEV_ACC_NORM_001');
    } else if (type === 'SYNTHETIC_ID') {
      // Injects transaction from the synthetic ring using the shared hardware fingerprint
      setSourceAcc('ACC_SYNTH_01');
      setTargetAcc('ACC_NORM_005');
      setAmount('4850.00'); // Bust-out amount
      setDeviceId('DEV_FINGERPRINT_RING1'); // Shared device
    } else if (type === 'MULE_CYCLE') {
      // Completes a cycle back to MULE_01
      setSourceAcc('ACC_MULE_04');
      setTargetAcc('ACC_MULE_01');
      setAmount('950.00'); // Smurfing
      setDeviceId('DEV_MULE_04');
    }
  };

  return (
    <div className="friendly-card rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Live Transaction Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Inject transactions to trigger real-time ML & graph risk scoring</p>
        </div>
      </div>

      {/* Preset Scenario Quick-Triggers */}
      <div>
        <label className="text-xs font-bold text-slate-700 mb-2 block uppercase tracking-wider">Quick Scenarios for Viva & Demo:</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadScenario('LEGIT')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            ✓ Legit User Transfer
          </button>
          <button
            type="button"
            onClick={() => loadScenario('SYNTHETIC_ID')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
          >
            ⚠ Synthetic ID Bust-Out
          </button>
          <button
            type="button"
            onClick={() => loadScenario('MULE_CYCLE')}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
          >
            🔄 P2P Mule Cycle Route
          </button>
        </div>
      </div>

      <form onSubmit={handleSimulate} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Sender Account</label>
            <input
              type="text"
              value={sourceAcc}
              onChange={(e) => setSourceAcc(e.target.value)}
              placeholder="e.g. ACC_NORM_001"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Recipient Account</label>
            <input
              type="text"
              value={targetAcc}
              onChange={(e) => setTargetAcc(e.target.value)}
              placeholder="e.g. ACC_NORM_002"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Transfer Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Device Fingerprint</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" /> Analyze & Execute Transfer
            </>
          )}
        </button>
      </form>

      {/* Real-Time Live Scoring Verdict */}
      {evaluationResult && (
        <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verdict</span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                evaluationResult.decision === 'DECLINE'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : evaluationResult.decision === 'REVIEW'
                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {evaluationResult.decision}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-slate-900">{evaluationResult.risk_score}</span>
            <span className="text-xs text-slate-500 font-semibold">/ 100 Risk Score</span>
          </div>

          {evaluationResult.explanations && evaluationResult.explanations.length > 0 ? (
            <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-600 block">Explainable AI (XAI) Evidence:</span>
              {evaluationResult.explanations.map((exp, i) => (
                <div key={i} className="text-xs p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs">
                  <div className="font-bold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {exp.factor}
                  </div>
                  <div className="text-slate-600 mt-0.5">{exp.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-emerald-700 flex items-center gap-1.5 mt-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Behavioral patterns and graph topology within safe thresholds.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
