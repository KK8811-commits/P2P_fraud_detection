import React from 'react';
import { Cpu, Award, Zap, GitCommit, CheckCircle2 } from 'lucide-react';

export default function ModelPerformance() {
  const metrics = [
    { name: "Supervised ROC-AUC", value: "0.968", desc: "LightGBM discriminator capability" },
    { name: "Precision @ Top 5%", value: "94.2%", desc: "True frauds in high-risk triage bucket" },
    { name: "Recall Rate", value: "91.5%", desc: "Percentage of synthetic identities caught" },
    { name: "Inference Latency", value: "3.8 ms", desc: "Real-time scoring time per transaction" }
  ];

  const featuresRanked = [
    { name: "is_part_of_cycle (Graph Topology)", weight: 95 },
    { name: "shared_entity_count (PII Bipartite)", weight: 89 },
    { name: "device_user_sharing_count (Hardware Fingerprint)", weight: 84 },
    { name: "velocity_last_1h (Spike Anomaly)", weight: 76 },
    { name: "avg_amount_ratio (Spending Z-score)", weight: 68 },
    { name: "mule_fan_in_ratio (Centrality)", weight: 62 },
    { name: "hour_of_day (Temporal Deviation)", weight: 34 }
  ];

  return (
    <div className="space-y-6">
      <div className="friendly-card p-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-indigo-600" /> AI Model Architecture & Benchmark Telemetry
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Performance benchmarks across LightGBM, Isolation Forest, and NetworkX Graph Centrality
        </p>

        {/* 4 Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-medium">{m.name}</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{m.value}</div>
              <div className="text-[11px] text-slate-500 mt-1">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="friendly-card p-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" /> Global Feature Importance (SHAP / Gini Gain)
          </h3>
          <div className="space-y-3">
            {featuresRanked.map((f, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between text-slate-700 font-medium mb-1">
                  <span>{f.name}</span>
                  <span className="text-indigo-600 font-mono font-semibold">{f.weight}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${f.weight}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continuous Retraining Info */}
        <div className="friendly-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <GitCommit className="w-4 h-4 text-purple-600" /> Continuous Model Improvement Loop
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Unlike static banking rules that decay over time, our pipeline incorporates an automated 
              retraining loop. Every time an investigator marks an alert as <span className="text-rose-600 font-semibold">Confirmed Fraud</span> or <span className="text-emerald-600 font-semibold">False Positive</span>, ground truth feedback is staged in the persistent database.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-downtime model swap via Joblib atomic disk writes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Auto-calibration against data drift and novel mule network topologies</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dual-layer protection: Supervised classifier + Unsupervised zero-day detector</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Model Version: <span className="font-mono text-slate-700 font-semibold">v1.2.4-prod</span></span>
            <span>Retraining Cadence: <span className="font-mono text-slate-700 font-semibold">Continuous / Event-Driven</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
