import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Code2,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AgentState } from '../types/hospital';

interface AgentDetailModalProps {
  agent: AgentState | null;
  onClose: () => void;
  onRetryAgent?: (agentId: string) => void;
  onUpdateTask?: (agentId: string, newTask: string) => void;
  canEditTask?: boolean;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
  onRetryAgent,
  onUpdateTask,
  canEditTask,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editedTask, setEditedTask] = useState(agent?.task || '');

  if (!agent) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(
      {
        agent: agent.name,
        task: agent.task,
        inputPayload: agent.inputPayload,
        outputResult: agent.outputResult,
      },
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTask = () => {
    if (onUpdateTask) {
      onUpdateTask(agent.id, editedTask);
    }
  };

  const renderFormattedResults = () => {
    if (!agent.outputResult) {
      return (
        <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">No output generated yet</p>
          <p className="text-xs text-slate-400">Run the workflow to see agent conclusions.</p>
        </div>
      );
    }

    const res = agent.outputResult;

    // Agent 4: Plan or Decision
    if (agent.id === 'agent4') {
      if (res.goal && res.agents) {
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Orchestrator Strategic Goal
              </span>
              <p className="text-sm font-medium text-indigo-950 mt-1">{res.goal}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                Specialist Deployment Plan
              </h4>
              <div className="grid gap-2">
                {res.agents.map((ag: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{ag.agent}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            ag.run ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {ag.run ? 'Active in Plan' : 'Skipped'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 italic font-medium">"{ag.task}"</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Rationale: {ag.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // Final decision
      if (res.top_alert || res.answer) {
        return (
          <div className="space-y-4">
            {res.top_alert && (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Top Management Alert
                </div>
                <p className="text-xs text-amber-950 mt-1.5 leading-relaxed font-medium">
                  {res.top_alert}
                </p>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 uppercase">Executive Answer</span>
              <p className="text-sm text-slate-800 mt-1">{res.answer}</p>
              {res.priority && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Priority:</span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    {res.priority}
                  </span>
                  <span className="text-xs text-slate-500 italic">({res.priority_reason})</span>
                </div>
              )}
            </div>

            {res.recommended_actions && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                  Recommended Management Actions
                </h4>
                <div className="space-y-2">
                  {res.recommended_actions.map((act: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <p className="text-xs font-semibold text-slate-900">{act.action}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span>Owner: <strong className="text-slate-700">{act.owner}</strong></span>
                        <span>Timeframe: <strong className="text-slate-700">{act.timeframe}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // Agent 1: Feedback
    if (agent.id === 'agent1') {
      return (
        <div className="space-y-4">
          {res.summary && (
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-900">Summary</span>
              <p className="text-xs text-emerald-950 mt-1">{res.summary}</p>
            </div>
          )}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-700 uppercase">
              Distinct Comment Evaluations ({res.comments?.length || 0})
            </h4>
            {res.comments?.map((c: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{c.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800">
                      {c.theme}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.sentiment}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 italic">"{c.reasoning}"</p>
                <div className="pt-1 text-[11px] text-slate-700">
                  <p><strong>Operational Issue:</strong> {c.operational_issue}</p>
                  <p><strong>Risk / Bias:</strong> {c.risk_or_bias_concern}</p>
                  <p className="text-teal-700"><strong>Recommended Action:</strong> {c.recommended_action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Agent 2: Monitoring
    if (agent.id === 'agent2') {
      return (
        <div className="space-y-4 text-xs">
          {res.patterns && (
            <div>
              <h4 className="font-semibold text-slate-700 uppercase mb-2">Identified Demographic Patterns</h4>
              <div className="space-y-2">
                {res.patterns.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                    <p className="font-semibold text-amber-950">{p.pattern}</p>
                    <p className="text-amber-800 mt-0.5">Evidence: {p.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res.equity_concerns && (
            <div>
              <h4 className="font-semibold text-slate-700 uppercase mb-2">Healthcare Equity & Access</h4>
              <div className="space-y-2">
                {res.equity_concerns.map((eq: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800">{eq.group}: </span>
                    <span className="text-slate-700">{eq.concern}</span>
                    <p className="text-slate-500 mt-1 italic">Evidence: {eq.evidence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {res.recommendation && (
            <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
              <span className="font-semibold text-teal-900 uppercase">Monitoring Recommendation</span>
              <p className="text-teal-950 mt-1">{res.recommendation}</p>
            </div>
          )}
        </div>
      );
    }

    // Agent 3: Triage
    if (agent.id === 'agent3') {
      return (
        <div className="space-y-4 text-xs">
          {res.summary && (
            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              <span className="font-semibold text-rose-900">Triage Summary</span>
              <p className="text-rose-950 mt-1">{res.summary}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-700 uppercase">Complaint Triage & Escalations</h4>
            {res.complaints?.map((cp: any, idx: number) => (
              <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cp.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {cp.primary_category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cp.severity_level >= 3
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Severity Level {cp.severity_level}
                    </span>
                  </div>
                  <span className="font-semibold text-teal-700">Route: {cp.route_to}</span>
                </div>
                <p className="text-slate-600">{cp.severity_reasoning}</p>
                {cp.human_review_required && (
                  <div className="p-2 bg-rose-50 rounded border border-rose-200 text-rose-900 font-medium">
                    ⚠️ Human Review Required: {cp.human_review_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Agent 6: Communication Evaluator
    if (agent.id === 'agent6') {
      return (
        <div className="space-y-4 text-xs">
          {res.improved_patient_message && (
            <div className="bg-violet-50/80 p-4 rounded-xl border border-violet-200">
              <span className="font-bold text-violet-900 uppercase tracking-wider text-[11px]">
                Rewritten Patient-Friendly Communication (6th-Grade Reading Level)
              </span>
              <p className="text-violet-950 font-medium text-sm mt-2 italic bg-white p-3 rounded-lg border border-violet-100">
                "{res.improved_patient_message}"
              </p>
            </div>
          )}

          {res.executive_summary && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <h5 className="font-semibold text-slate-800">Executive Communication Summary</h5>
              <p className="text-slate-600"><strong>Quality:</strong> {res.executive_summary.overall_quality}</p>
              <p className="text-slate-600"><strong>Weaknesses:</strong> {res.executive_summary.major_weaknesses}</p>
              <p className="text-rose-700"><strong>Highest Risk:</strong> {res.executive_summary.highest_risk}</p>
              <p className="text-teal-700"><strong>Priority Fix:</strong> {res.executive_summary.most_important_improvement}</p>
            </div>
          )}
        </div>
      );
    }

    // Agent 5: Analytics
    if (agent.id === 'agent5') {
      return (
        <div className="space-y-4 text-xs">
          {res.headline && (
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
              <span className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                Executive Overview Headline
              </span>
              <p className="text-teal-950 font-semibold text-sm mt-1">{res.headline}</p>
            </div>
          )}

          {res.top_priorities && (
            <div>
              <h4 className="font-semibold text-slate-700 uppercase mb-2">Top 5 Organizational Priorities</h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                {res.top_priorities.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {res.quick_wins && (
            <div>
              <h4 className="font-semibold text-slate-700 uppercase mb-2">Quick Wins (&lt; 3 Months)</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {res.quick_wins.map((qw: string, i: number) => (
                  <div key={i} className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
                    ✓ {qw}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <pre className="p-3 bg-slate-50 rounded-lg border text-xs overflow-x-auto text-slate-700">
        {JSON.stringify(res, null, 2)}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${agent.badgeBg} ${agent.borderColor}`}>
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{agent.name}</h3>
              <p className="text-xs text-slate-500">{agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 flex-1">
          {/* Agent Task */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Assigned Agent Task
              </span>
              {canEditTask && (
                <button
                  onClick={handleSaveTask}
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 underline"
                >
                  Save Task Edits
                </button>
              )}
            </div>
            {canEditTask ? (
              <textarea
                value={editedTask}
                onChange={(e) => setEditedTask(e.target.value)}
                rows={2}
                className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <p className="text-xs text-slate-700 italic">
                "{agent.task || 'Awaiting assignment from Orchestrator'}"
              </p>
            )}
          </div>

          {/* Input Data Received Preview */}
          <details className="group border border-slate-200 rounded-xl bg-white p-3.5">
            <summary className="text-xs font-semibold text-slate-700 uppercase cursor-pointer flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                Data Payload Received by Agent
              </span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <pre className="text-[11px] bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                {JSON.stringify(agent.inputPayload || { message: 'Pending data transmission' }, null, 2)}
              </pre>
            </div>
          </details>

          {/* Results Area */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Agent Output & Synthesis
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {showRawJson ? 'Formatted Card View' : 'Show Raw JSON'}
                </button>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {showRawJson ? (
              <pre className="text-[11px] bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto max-h-72 font-mono">
                {JSON.stringify(agent.outputResult || { status: 'Pending execution' }, null, 2)}
              </pre>
            ) : (
              renderFormattedResults()
            )}
          </div>
        </div>

        {/* Modal Footer with Retry Button */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Execution Status: <strong className="capitalize text-slate-700">{agent.status}</strong>
          </span>
          <div className="flex items-center gap-2">
            {onRetryAgent && (
              <button
                onClick={() => onRetryAgent(agent.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Re-run Agent
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
