import React from 'react';
import {
  CheckCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AgentState } from '../types/hospital';

interface StepReviewBarProps {
  runMode: 'auto' | 'step';
  activeStep: number; // 0: Idle, 1: Planning, 2: Specialists, 3: Analytics, 4: Decision, 5: Finished
  isPausedForReview: boolean;
  agents: Record<string, AgentState>;
  onApproveAndContinue: () => void;
  onToggleSpecialistActive: (agentId: string) => void;
  onUpdateAgentTask: (agentId: string, task: string) => void;
  onRetryAgent: (agentId: string) => void;
}

export const StepReviewBar: React.FC<StepReviewBarProps> = ({
  runMode,
  activeStep,
  isPausedForReview,
  agents,
  onApproveAndContinue,
  onToggleSpecialistActive,
  onUpdateAgentTask,
  onRetryAgent,
}) => {
  if (runMode === 'auto' || !isPausedForReview) {
    return null;
  }

  // Step 1 Review: After Agent 4 Plan
  if (activeStep === 1) {
    return (
      <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 shadow-xs mb-6 animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 shadow-xs">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Step 1 Human Oversight Review
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Verify Orchestrator Plan Before Specialist Execution
              </h3>
            </div>
          </div>

          <button
            onClick={onApproveAndContinue}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
          >
            <span>Approve Plan & Run Specialists</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-3 font-medium">
          The Orchestrator proposed the specialist tasks below. You can toggle specialists on/off or customize their tasks before execution begins:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['agent1', 'agent2', 'agent3', 'agent6'].map((id) => {
            const ag = agents[id];
            if (!ag) return null;
            return (
              <div
                key={id}
                className={`p-3 rounded-xl border transition-all ${
                  ag.activeInPlan
                    ? 'bg-white border-amber-200 shadow-2xs'
                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ag.activeInPlan}
                      onChange={() => onToggleSpecialistActive(id)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">{ag.name}</span>
                  </label>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      ag.activeInPlan
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {ag.activeInPlan ? 'Included' : 'Skipped'}
                  </span>
                </div>

                <div className="flex items-start gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                  <input
                    type="text"
                    disabled={!ag.activeInPlan}
                    value={ag.task}
                    onChange={(e) => onUpdateAgentTask(id, e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-transparent disabled:border-none"
                    placeholder="Enter custom task for this agent..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Step 2 Review: After Specialists Run
  if (activeStep === 2) {
    return (
      <div className="bg-teal-50/80 border border-teal-300 rounded-2xl p-5 shadow-xs mb-6 animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Step 2 Human Oversight Review
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Specialist Findings Ready for Executive Analytics
              </h3>
            </div>
          </div>

          <button
            onClick={onApproveAndContinue}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
          >
            <span>Approve & Continue to Analytics (Agent 5)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Click any specialist card in the diagram above to inspect details. If any agent's findings appear flawed, click its card to re-run only that specialist without repeating finished calls.
        </p>
      </div>
    );
  }

  // Step 3 Review: After Agent 5 Analytics Run
  if (activeStep === 3) {
    return (
      <div className="bg-indigo-50/80 border border-indigo-300 rounded-2xl p-5 shadow-xs mb-6 animate-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                Step 3 Human Oversight Review
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Executive Synthesis Complete • Ready for Final Decision
              </h3>
            </div>
          </div>

          <button
            onClick={onApproveAndContinue}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
          >
            <span>Approve & Send to Agent 4 for Final Decision</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Agent 5 has compiled the organizational findings and AI risk monitoring. Click Continue to have Agent 4 issue the final top management alert, answer, and recommendations.
        </p>
      </div>
    );
  }

  return null;
};
