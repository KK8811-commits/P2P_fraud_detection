import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Info, HelpCircle, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function GraphVisualizer({ graphData, onSelectNode }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [filterType, setFilterType] = useState('ALL'); // ALL, USERS, ENTITIES, MONEY_FLOW

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return;

    // Filter nodes if user chooses a specific lens
    const filteredRawNodes = graphData.nodes.filter(n => {
      if (filterType === 'ALL') return true;
      if (filterType === 'USERS') return n.group === 'USER' || n.group === 'ACCOUNT';
      if (filterType === 'ENTITIES') return n.group === 'PHONE' || n.group === 'SSN' || n.group === 'DEVICE' || n.group === 'ADDRESS';
      if (filterType === 'MONEY_FLOW') return n.group === 'ACCOUNT';
      return true;
    });

    const activeNodeIds = new Set(filteredRawNodes.map(n => n.id));

    // Clear and friendly styling with clean text badges
    const styledNodes = filteredRawNodes.map(n => {
      let bg = '#3b82f6';
      let border = '#60a5fa';
      let shape = 'dot';
      let size = 26;
      let friendlyName = n.label;

      if (n.group === 'USER') {
        bg = '#10b981';
        border = '#34d399';
        size = 30;
      } else if (n.group === 'PHONE') {
        bg = '#f59e0b';
        border = '#fbbf24';
        shape = 'diamond';
        size = 22;
        friendlyName = `Phone: ${n.label}`;
      } else if (n.group === 'SSN') {
        bg = '#ef4444';
        border = '#f87171';
        shape = 'triangle';
        size = 22;
        friendlyName = 'Stolen SSN Hash';
      } else if (n.group === 'DEVICE') {
        bg = '#8b5cf6';
        border = '#a78bfa';
        shape = 'square';
        size = 24;
        friendlyName = `Hardware: ${n.label}`;
      } else if (n.group === 'ACCOUNT') {
        bg = '#2563eb';
        border = '#3b82f6';
        size = 24;
        friendlyName = `Bank Acc: ${n.label}`;
      }

      return {
        ...n,
        label: friendlyName,
        color: {
          background: bg,
          border: border,
          highlight: { background: '#ec4899', border: '#f43f5e' }
        },
        font: {
          color: '#ffffff',
          size: 13,
          face: 'Plus Jakarta Sans',
          background: 'rgba(15, 23, 42, 0.85)',
          strokeWidth: 2,
          strokeColor: '#0f172a'
        },
        borderWidth: 2,
        shape,
        size
      };
    });

    const styledEdges = (graphData.edges || [])
      .filter(e => activeNodeIds.has(e.from) && activeNodeIds.has(e.to))
      .map((e, idx) => ({
        id: `edge_${idx}`,
        from: e.from,
        to: e.to,
        label: e.label,
        color: { color: e.label.includes('$') ? '#38bdf8' : '#64748b', highlight: '#ec4899' },
        font: {
          color: e.label.includes('$') ? '#38bdf8' : '#94a3b8',
          size: 11,
          align: 'middle',
          background: 'rgba(15, 23, 42, 0.75)'
        },
        arrows: e.label.includes('$') ? 'to' : '',
        width: e.label.includes('$') ? 2.5 : 1.5,
        smooth: { type: 'cubicBezier', roundness: 0.2 }
      }));

    const data = {
      nodes: new DataSet(styledNodes),
      edges: new DataSet(styledEdges)
    };

    const options = {
      physics: {
        stabilization: { iterations: 150 },
        barnesHut: {
          gravitationalConstant: -4000,
          centralGravity: 0.2,
          springLength: 140,
          springConstant: 0.03,
          damping: 0.09
        }
      },
      interaction: {
        hover: true,
        zoomView: true,
        dragView: true,
        navigationButtons: false
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const rawNode = graphData.nodes.find(n => n.id === nodeId);
        setSelectedNodeInfo(rawNode);
        if (onSelectNode) onSelectNode(nodeId);
      }
    });

    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, [graphData, filterType]);

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.3 });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.7 });
    }
  };

  const handleResetZoom = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 500 } });
    }
  };

  return (
    <div className="space-y-4">
      {/* Friendly "How to Read this Graph" Explainer Box */}
      <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-300">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          How to Read this Relationship Map (In Simple Terms):
        </div>
        <p className="text-slate-300 leading-relaxed">
          Fraudsters don't act alone; they reuse devices, fake names, and bounce money in circles. 
          Each dot is an <strong>entity</strong>. When you see multiple <span className="text-emerald-400 font-bold">Green Users</span> pointing to the same <span className="text-amber-400 font-bold">Amber Phone</span> or <span className="text-purple-400 font-bold">Purple Device</span>, it reveals a <strong>Synthetic Identity Theft Ring</strong> hiding in plain sight.
        </p>
      </div>

      {/* Visual Canvas Container */}
      <div className="relative w-full h-[520px] bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Entity Category Legend */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 backdrop-blur shadow-lg">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> User Identity
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Bank Account
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Shared Phone
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> SSN Hash
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800/60 text-purple-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Hardware Device
          </span>
        </div>

        {/* View Lens Filter (Simplifier) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur shadow-lg text-xs">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> View Lens:
          </span>
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterType === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            All Connections
          </button>
          <button
            onClick={() => setFilterType('ENTITIES')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterType === 'ENTITIES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Shared PII Only
          </button>
          <button
            onClick={() => setFilterType('MONEY_FLOW')}
            className={`px-2.5 py-1 rounded-lg font-bold transition ${filterType === 'MONEY_FLOW' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Money Transfers
          </button>
        </div>

        {/* Zoom & Navigation Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Fit to Screen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Node Detail Popup Drawer */}
        {selectedNodeInfo && (
          <div className="absolute bottom-4 left-4 z-10 p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-xl backdrop-blur max-w-sm text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 font-bold text-white">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" /> Inspected Node Dossier
              </span>
              <button
                onClick={() => setSelectedNodeInfo(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div><span className="text-slate-400">ID:</span> <span className="text-blue-300">{selectedNodeInfo.id}</span></div>
              <div><span className="text-slate-400">Type:</span> <span className="text-emerald-300">{selectedNodeInfo.group}</span></div>
              <div><span className="text-slate-400">Label:</span> <span className="text-slate-200">{selectedNodeInfo.label}</span></div>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}
