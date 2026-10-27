import React, { useState } from 'react';
import { Compass, CheckCircle2, ArrowRight, X, Shield, Network, FileSpreadsheet, Cpu } from 'lucide-react';

export default function WalkthroughModal({ isOpen, onClose, onNavigateTab }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Step 1: Real-Time Fraud Triage & Simulation",
      tab: "LIVE_OPS",
      description: "In the Live Operations Hub, you can inject single transactions or test pre-packaged fraud scenarios (e.g. Synthetic ID Bust-Out or Mule Ring cycle routing). The ML pipeline produces an instant 0–100 risk score paired with Explainable AI (XAI) evidence factors.",
      highlight: "Try clicking the '⚠ Synthetic ID Bust-Out' button in the simulator!"
    },
    {
      title: "Step 2: Graph-Based Relationship Intelligence",
      tab: "GRAPH_STUDIO",
      description: "Click on any transaction or entity to open the interactive bipartite identity graph. Notice how seemingly unrelated accounts are linked together through shared phone numbers, addresses, and hardware device fingerprints.",
      highlight: "Click any node in the graph to automatically expand its 2-hop connected cluster."
    },
    {
      title: "Step 3: Regulatory Compliance & SAR Dossiers",
      tab: "LIVE_OPS",
      description: "When an investigator verifies a high-risk fraud ring, regulations require filing a Suspicious Activity Report (SAR). Our system generates an official, print-ready compliance PDF dossier with a single click.",
      highlight: "Look for the blue 'SAR PDF' button on any alert card in the queue."
    },
    {
      title: "Step 4: Continuous Model Improvement Loop",
      tab: "MODEL_TELEMETRY",
      description: "When analysts mark an alert as 'Confirmed Fraud' or 'False Positive', verified labels are recorded into the database. The background retraining worker automatically updates model weights to prevent concept drift.",
      highlight: "Inspect the Global Feature Importance bars and real-time benchmark metrics."
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onNavigateTab(steps[nextStep].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onNavigateTab(steps[prevStep].tab);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4" /> Examiner & Viva Guided Tour • Step {currentStep + 1} of {steps.length}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {step.description}
        </p>

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />
          <span><strong>Examiner Tip:</strong> {step.highlight}</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
          >
            Previous
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition shadow-sm"
          >
            {currentStep === steps.length - 1 ? "Finish Tour" : "Next Step"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
