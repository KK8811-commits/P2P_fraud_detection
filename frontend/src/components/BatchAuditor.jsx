import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ArrowDownCircle, RefreshCw } from 'lucide-react';

export default function BatchAuditor() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/batch/audit', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Batch audit error:", err);
      alert("Failed to process batch CSV. Ensure backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to generate a demo CSV file on the fly
  const generateSampleCsv = () => {
    let csvContent = "source_account_id,target_account_id,amount,velocity\n";
    for (let i = 1; i <= 35; i++) {
      const isMule = i % 8 === 0;
      const isSynth = i % 11 === 0;
      const amt = isSynth ? (4200 + i * 20).toFixed(2) : isMule ? (950 + i).toFixed(2) : (45 + i * 5).toFixed(2);
      const vel = isMule ? 6 : 1;
      csvContent += `ACC_EXT_${i},ACC_EXT_${i + 1},${amt},${vel}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "banking_transactions_sample.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="friendly-card rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" /> Enterprise Batch CSV Auditor
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Audit historical banking logs (PaySim, Core Banking Ledger, or Kaggle) through the dual ML & Graph pipeline
            </p>
          </div>
          <button
            onClick={generateSampleCsv}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" /> Download Sample CSV
          </button>
        </div>

        {/* Drag and drop zone */}
        <div className="mt-6 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/70 rounded-2xl p-8 text-center transition">
          <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800">
            {file ? file.name : "Select a transaction CSV file to audit"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Supports UTF-8 CSV with columns: source_account_id, target_account_id, amount, velocity</p>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload-input"
          />
          <div className="mt-4 flex items-center justify-center gap-3">
            <label
              htmlFor="csv-upload-input"
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-300 shadow-xs"
            >
              Browse Files
            </label>
            {file && (
              <button
                onClick={handleUpload}
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Run AI Risk Audit"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit summary metrics & table */}
      {results && (
        <div className="friendly-card rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Transactions Audited</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{results.processed_rows}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Dollar Volume Audited</span>
              <div className="text-2xl font-extrabold text-indigo-700 mt-1">${results.total_dollar_volume.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">High-Risk Fraud Flags</span>
              <div className="text-2xl font-extrabold text-red-600 mt-1">{results.high_risk_flags_detected} Cases</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Audited Transactions Sample (First 25 Rows)</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Risk Score</th>
                    <th className="px-4 py-3">Verdict</th>
                    <th className="px-4 py-3">Detected Anomaly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-mono">
                  {results.sample_records.map((r) => (
                    <tr key={r.row} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-2.5 text-slate-400 font-medium">{r.row}</td>
                      <td className="px-4 py-2.5 font-bold text-indigo-700">{r.source}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{r.target}</td>
                      <td className="px-4 py-2.5 font-extrabold text-slate-900">${r.amount.toFixed(2)}</td>
                      <td className="px-4 py-2.5 font-extrabold">
                        <span className={r.risk_score >= 60 ? 'text-red-600' : 'text-emerald-600'}>
                          {r.risk_score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.decision === 'DECLINE' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {r.decision}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans font-medium text-slate-600">{r.primary_flag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
