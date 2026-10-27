import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, CheckSquare, RefreshCw, Network, 
  Layers, Users, TrendingUp, UserCheck, LogIn, LogOut, Radio, 
  FileSpreadsheet, Cpu 
} from 'lucide-react';
import GraphVisualizer from './components/GraphVisualizer';
import TransactionSimulator from './components/TransactionSimulator';
import AlertQueue from './components/AlertQueue';
import LoginModal from './components/LoginModal';
import BatchAuditor from './components/BatchAuditor';
import ModelPerformance from './components/ModelPerformance';
import LiveBankTicker from './components/LiveBankTicker';
import WalkthroughModal from './components/WalkthroughModal';
import GraphQueryLab from './components/GraphQueryLab';
import RiskPolicySimulator from './components/RiskPolicySimulator';
import { Compass } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedEntityId, setSelectedEntityId] = useState('USR_SYNTH_01');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('LIVE_OPS'); // LIVE_OPS, GRAPH_STUDIO, BATCH_AUDIT, MODEL_TELEMETRY
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('analyst_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Fetch initial dashboard metrics
  const loadDashboardData = async () => {
    try {
      const [statsRes, alertsRes, accountsRes] = await Promise.all([
        fetch('/api/v1/analytics/stats').then(r => r.json()),
        fetch('/api/v1/alerts').then(r => r.json()),
        fetch('/api/v1/accounts').then(r => r.json())
      ]);
      setStats(statsRes);
      setAlerts(alertsRes);
      setAccounts(accountsRes);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subgraph for visualizer
  const loadGraphForEntity = async (entityId) => {
    try {
      const res = await fetch(`/api/v1/graph/subgraph?entity_id=${encodeURIComponent(entityId)}&depth=2`);
      const data = await res.json();
      setGraphData(data);
      setSelectedEntityId(entityId);
    } catch (err) {
      console.error("Error fetching subgraph:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadGraphForEntity('USR_SYNTH_01');
  }, []);

  const handleTransactionEvaluated = (result) => {
    loadDashboardData();
    // Focus graph on the transaction source entity
    if (result.features && result.features.source_account_id) {
      loadGraphForEntity(result.features.source_account_id);
    }
  };

  const handleSelectAlert = (alert) => {
    loadGraphForEntity(alert.source_account);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl shadow-md text-white">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              FraudGraph AI <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">Bank Intelligence</span>
            </h1>
            <p className="text-xs text-slate-500">Autonomous Synthetic Identity Theft & P2P Mule Detection Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Engine Online
          </div>

          <button
            onClick={() => setIsTourOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            title="Start Examiner & Viva Guided Tour"
          >
            <Compass className="w-3.5 h-3.5 fill-current" /> Examiner Tour
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 font-medium">{currentUser.role}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('fraud_token');
                  localStorage.removeItem('analyst_user');
                  setCurrentUser(null);
                }}
                className="ml-2 text-slate-400 hover:text-red-600 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Analyst Login
            </button>
          )}

          <button
            onClick={loadDashboardData}
            className="p-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />

      <WalkthroughModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 friendly-card rounded-2xl relative overflow-hidden transition">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-bold uppercase tracking-wider">
              <span>Total Transactions Scanned</span>
              <Activity className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats ? stats.total_transactions : '---'}</div>
            <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live ingestion stream active
            </div>
          </div>

          <div className="p-5 friendly-card rounded-2xl relative overflow-hidden transition">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-bold uppercase tracking-wider">
              <span>Active Fraud Alerts</span>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold text-red-600 tracking-tight">{stats ? stats.total_alerts : '---'}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">{stats ? stats.pending_reviews : 0} pending analyst triage</div>
          </div>

          <div className="p-5 friendly-card rounded-2xl relative overflow-hidden transition">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-bold uppercase tracking-wider">
              <span>Confirmed Fraud Cases</span>
              <CheckSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-extrabold text-purple-600 tracking-tight">{stats ? stats.confirmed_fraud_count : '---'}</div>
            <div className="text-xs text-purple-600/90 mt-2 font-medium">Staged for AI retraining</div>
          </div>

          <div className="p-5 friendly-card rounded-2xl relative overflow-hidden transition">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-bold uppercase tracking-wider">
              <span>Average Risk Index</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight">{stats ? `${stats.average_risk_score}/100` : '---'}</div>
            <div className="text-xs text-slate-500 mt-2 font-medium">Across all active accounts</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('LIVE_OPS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'LIVE_OPS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Radio className="w-4 h-4" /> Live Operations Hub
          </button>

          <button
            onClick={() => setActiveTab('GRAPH_STUDIO')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'GRAPH_STUDIO'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Network className="w-4 h-4" /> Graph Intelligence Studio
          </button>

          <button
            onClick={() => setActiveTab('BATCH_AUDIT')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'BATCH_AUDIT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Batch CSV Auditor
          </button>

          <button
            onClick={() => setActiveTab('MODEL_TELEMETRY')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'MODEL_TELEMETRY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-4 h-4" /> AI Telemetry & Policy Simulation
          </button>
        </div>

        {/* Tab 1: Live Operations Hub */}
        {activeTab === 'LIVE_OPS' && (
          <div className="space-y-6">
            <LiveBankTicker onStreamEvent={loadDashboardData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionSimulator 
                accounts={accounts} 
                onTransactionEvaluated={handleTransactionEvaluated} 
              />
              <AlertQueue 
                alerts={alerts} 
                onSelectAlert={(alt) => {
                  handleSelectAlert(alt);
                  setActiveTab('GRAPH_STUDIO');
                }} 
                onFeedbackSubmitted={loadDashboardData} 
              />
            </div>
          </div>
        )}

        {/* Tab 2: Graph Intelligence Studio */}
        {activeTab === 'GRAPH_STUDIO' && (
          <div className="space-y-6">
            <GraphQueryLab onQueryExecuted={(subg) => setGraphData(subg)} />

            <div className="friendly-card rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-600" /> Graph-Based Relationship Intelligence Studio
                  </h2>
                  <p className="text-xs text-slate-500">
                    Interactive physics canvas: Click any node to navigate its 2-hop connected component and shared PII
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Inspecting Node:</span>
                  <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedEntityId}
                  </span>
                  <button
                    onClick={() => loadGraphForEntity('USR_SYNTH_01')}
                    className="px-3 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200 cursor-pointer"
                  >
                    Reset to Synthetic Ring
                  </button>
                </div>
              </div>

              <GraphVisualizer 
                graphData={graphData} 
                onSelectNode={(nodeId) => loadGraphForEntity(nodeId)} 
              />
            </div>
          </div>
        )}

        {/* Tab 3: Batch CSV Auditor */}
        {activeTab === 'BATCH_AUDIT' && (
          <BatchAuditor />
        )}

        {/* Tab 4: Model Benchmarks & Retraining */}
        {activeTab === 'MODEL_TELEMETRY' && (
          <div className="space-y-6">
            <RiskPolicySimulator />
            <ModelPerformance />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 font-medium">
        FraudGraph AI • Autonomous Financial Crime & Synthetic Identity Defense Platform • Dual ML & Graph Engine
      </footer>
    </div>
  );
}
