import React, { useState, useEffect } from 'react';
import { Sliders, DollarSign, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';

export default function RiskPolicySimulator() {
  const [threshold, setThreshold] = useState(75);
  const [simulation, setSimulation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSimulation = async (val) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/policy/simulate?threshold=${val}`);
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation(threshold);
  }, [threshold]);

  return (
    <div className="friendly-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Executive Risk Policy & Financial Impact Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate bank P&L trade-offs: Calibrate fraud capture rates versus customer checkout friction
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500">Current Threshold:</span>
          <span className="font-bold text-indigo-600 font-mono text-sm">{threshold} / 100</span>
        </div>
      </div>

      {/* Slider Control */}
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Aggressive Mode (Lower Threshold = High Friction)</span>
          <span>Permissive Mode (Higher Threshold = High Leaks)</span>
        </div>
        <input
          type="range"
          min="20"
          max="95"
          step="1"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
          <span>20 (Flag Almost Everything)</span>
          <span>50 (Balanced Midpoint)</span>
          <span>75 (Default Baseline)</span>
          <span>95 (Only Flag Definite Frauds)</span>
        </div>
      </div>

      {/* Real-Time Financial Impact Metrics */}
      {simulation && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>Fraud Losses Prevented</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ${simulation.fraud_prevented_dollars?.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600/90 mt-1">
              {simulation.fraud_detection_rate_pct}% of total malicious volume caught
            </div>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-rose-800 font-medium">
              <span>Customer Friction Volume</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-1">
              ${simulation.false_positive_blocked_dollars?.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-600/90 mt-1">
              {simulation.customer_friction_rate_pct}% legitimate user decline rate
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-indigo-800 font-medium">
              <span>Net Financial Recovery</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">
              ${simulation.estimated_net_recovery?.toLocaleString()}
            </div>
            <div className="text-[11px] text-indigo-600/90 mt-1">
              After factoring $15/case manual review labor
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Policy Status</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {threshold >= 80 ? "Optimized" : threshold <= 40 ? "Over-Strict" : "Standard"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {simulation.declined_count} total transfers flagged for action
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
