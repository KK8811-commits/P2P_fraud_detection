import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, ShieldAlert, ShieldCheck, Zap, Lock, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LiveBankTicker({ onStreamEvent }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEvents, setStreamEvents] = useState([]);
  const [speedMs, setSpeedMs] = useState(2500);
  const [defenseStats, setDefenseStats] = useState({ frozen: 0, blacklisted: 0 });
  const intervalRef = useRef(null);

  const fetchStreamTransaction = async () => {
    try {
      const res = await fetch('/api/v1/stream/random-transaction');
      const data = await res.json();

      setStreamEvents((prev) => [data, ...prev.slice(0, 14)]);
      setDefenseStats({
        frozen: data.frozen_count || 0,
        blacklisted: data.blacklisted_devices_count || 0
      });

      if (onStreamEvent) {
        onStreamEvent(data);
      }
    } catch (err) {
      console.error("Stream fetch error:", err);
    }
  };

  useEffect(() => {
    if (isStreaming) {
      fetchStreamTransaction(); // Run immediate first tick
      intervalRef.current = setInterval(fetchStreamTransaction, speedMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isStreaming, speedMs]);

  return (
    <div className="friendly-card rounded-2xl p-6 shadow-xs space-y-4">
      {/* Stream Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Live Bank Ingestion Stream (Real-Time Ticker)
          </h3>
          <p className="text-xs text-slate-500">
            Simulates real-world core banking payment rails arriving into the dual ML & Graph scoring pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <span>Interval:</span>
            <select
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              disabled={isStreaming}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-medium cursor-pointer"
            >
              <option value={1500}>1.5s (Fast)</option>
              <option value={2500}>2.5s (Normal)</option>
              <option value={4000}>4.0s (Slow)</option>
            </select>
          </div>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
              isStreaming
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Stop Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start Live Traffic
              </>
            )}
          </button>
        </div>
      </div>

      {/* Automated Defense Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-slate-500 font-medium block">Stream Status</span>
          <span className={`font-bold flex items-center gap-1.5 mt-0.5 ${isStreaming ? 'text-emerald-700' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            {isStreaming ? 'STREAMING ACTIVE' : 'IDLE / PAUSED'}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-slate-500 font-medium block">Auto-Frozen Accounts</span>
          <span className="font-extrabold text-red-600 mt-0.5 block">{defenseStats.frozen} Accounts</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-slate-500 font-medium block">Blacklisted Devices</span>
          <span className="font-extrabold text-purple-700 mt-0.5 block">{defenseStats.blacklisted} Fingerprints</span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-slate-500 font-medium block">Defense Protocol</span>
          <span className="font-bold text-indigo-700 mt-0.5 block">AUTO-BLOCK &gt; 80 RISK</span>
        </div>
      </div>

      {/* Real-Time Scrolling Stream Feed */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {streamEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Stream paused. Click <strong>"Start Live Traffic"</strong> to simulate incoming real-time transactions.
          </div>
        ) : (
          streamEvents.map((evt, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                evt.decision === 'DECLINE'
                  ? 'bg-red-50/90 border-red-200'
                  : evt.decision === 'REVIEW'
                  ? 'bg-amber-50/90 border-amber-200'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 font-mono">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    evt.decision === 'DECLINE'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : evt.decision === 'REVIEW'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {evt.decision} ({evt.risk_score})
                </span>
                <span className="text-slate-800 font-semibold">{evt.features?.source_account_id}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-800 font-semibold">{evt.features?.target_account_id}</span>
                <span className="font-extrabold text-slate-900">${evt.features?.amount?.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                {evt.auto_action ? (
                  <span className="text-red-600 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Auto-Frozen
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cleared
                  </span>
                )}
                {evt.explanations && evt.explanations.length > 0 && (
                  <span className="text-slate-600 font-medium truncate max-w-xs">
                    [{evt.explanations[0].factor}]
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
