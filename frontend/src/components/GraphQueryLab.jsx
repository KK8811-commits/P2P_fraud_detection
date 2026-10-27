import React, { useState } from 'react';
import { Search, Terminal, AlertTriangle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

export default function GraphQueryLab({ onQueryExecuted }) {
  const [queryType, setQueryType] = useState('CYCLES');
  const [paramThreshold, setParamThreshold] = useState(2);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  const PRESETS = [
    {
      id: 'CYCLES',
      name: 'Circular Mule Laundering Cycles',
      cypher: 'MATCH path = (a:Account)-[:TRANSFERRED*3..5]->(a) RETURN path',
      desc: 'Discovers closed money transfer loops routing stolen funds back to originating mule accounts.'
    },
    {
      id: 'SHARED_PII',
      name: 'Synthetic Identity PII Clusters',
      cypher: 'MATCH (u1:User)-[:SHARED_PII]->(p)<-[:SHARED_PII]-(u2:User) WHERE u1 <> u2 RETURN p, u1, u2',
      desc: 'Pinpoints fabricated identity rings sharing identical phone numbers, addresses, SSNs, or devices.'
    },
    {
      id: 'MULE_FAN_IN',
      name: 'Mule Inflow Smurfing Aggregators',
      cypher: 'MATCH (src)-[r:TRANSFERRED]->(dst:Account) WITH dst, count(r) as in_degree WHERE in_degree > 3 RETURN dst',
      desc: 'Flags accounts receiving rapid deposits from multiple disparate sources with negligible outward flow.'
    }
  ];

  const handleRunQuery = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/v1/graph/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_type: queryType,
          param_threshold: Number(paramThreshold)
        })
      });
      const data = await res.json();
      setQueryResult(data);
      if (onQueryExecuted && data.subgraph) {
        onQueryExecuted(data.subgraph);
      }
    } catch (err) {
      console.error("Graph query error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedPreset = PRESETS.find(p => p.id === queryType) || PRESETS[0];

  return (
    <div className="friendly-card rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-600" />
            Graph Intelligence Query Console (Cypher Engine)
          </h3>
          <p className="text-xs text-slate-500">
            Execute topological graph queries across identity and transaction graphs to extract targeted fraud rings
          </p>
        </div>
      </div>

      {/* Query Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setQueryType(p.id)}
            className={`p-3.5 rounded-xl text-left border transition text-xs cursor-pointer ${
              queryType === p.id
                ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="font-bold text-slate-900">{p.name}</div>
            <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* Cypher Code Box */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-indigo-800 flex flex-col gap-1.5">
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Compiled Cypher Query:</span>
        <code className="font-bold">{selectedPreset.cypher}</code>
      </div>

      {/* Threshold and Execute Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
          <span>Minimum Cluster / Cycle Depth:</span>
          <input
            type="number"
            min={2}
            max={6}
            value={paramThreshold}
            onChange={(e) => setParamThreshold(e.target.value)}
            className="w-16 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-center text-slate-900 font-bold"
          />
        </div>

        <button
          onClick={handleRunQuery}
          disabled={isExecuting}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Execute Graph Traversal
        </button>
      </div>

      {/* Query Findings */}
      {queryResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Traversal Results: {queryResult.matched_nodes.length} Nodes Discovered
            </span>
            <span className="text-[11px] text-emerald-700 font-mono font-medium">Graph Rendered Below</span>
          </div>

          <div className="space-y-1 pt-1">
            {queryResult.findings.slice(0, 3).map((f, i) => (
              <div key={i} className="text-emerald-800 font-mono text-[11px] flex items-start gap-1">
                <span className="text-emerald-600">•</span> {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
