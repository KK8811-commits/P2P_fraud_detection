import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, ArrowRight, Eye } from 'lucide-react';

export default function AlertQueue({ alerts, onSelectAlert, onFeedbackSubmitted }) {
  const handleFeedback = async (alertId, outcome) => {
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified_outcome: outcome,
          notes: `Verified by investigator as ${outcome}`
        })
      });
      if (res.ok && onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" /> Fraud Alerts & Investigation Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">High-risk flagged transactions awaiting human investigator triage</p>
        </div>
        <span className="px-3 py-1 text-xs font-bold bg-slate-800/80 text-slate-200 border border-slate-700 rounded-full">
          {alerts.length} Total Alerts
        </span>
      </div>

      <div className="overflow-y-auto space-y-3 flex-1 pr-1">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            No active alerts in queue. System operational.
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.alert_id}
              className="p-4 bg-slate-50/90 border border-slate-200/90 hover:border-indigo-300 rounded-xl transition shadow-2xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                    {alt.risk_score} RISK
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500">{alt.alert_id}</span>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    alt.status === 'CONFIRMED_FRAUD'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : alt.status === 'FALSE_POSITIVE'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  {alt.status}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-700 mb-2">
                <span className="font-bold text-indigo-700">{alt.source_account}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-800">{alt.target_account}</span>
                <span className="ml-auto font-extrabold text-slate-900">${alt.amount.toFixed(2)}</span>
              </div>

              {/* Explanations summary */}
              <div className="space-y-1 mb-3">
                {alt.explanations.slice(0, 2).map((exp, idx) => (
                  <div key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-red-600 font-bold">• {exp.factor}:</span> {exp.detail}
                  </div>
                ))}
              </div>

              {/* Action Buttons: Investigate Graph + PDF Export + Submit Feedback */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectAlert(alt)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600" /> View Graph
                  </button>

                  <a
                    href={`/api/v1/alerts/${alt.alert_id}/report/pdf`}
                    download
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1 transition shadow-xs"
                    title="Export Official Suspicious Activity Report (SAR)"
                  >
                    SAR PDF
                  </a>
                </div>

                {alt.status === 'PENDING' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleFeedback(alt.alert_id, 'FRAUD')}
                      className="px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-600" /> Confirm Fraud
                    </button>
                    <button
                      onClick={() => handleFeedback(alt.alert_id, 'LEGITIMATE')}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-emerald-600" /> False Positive
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
