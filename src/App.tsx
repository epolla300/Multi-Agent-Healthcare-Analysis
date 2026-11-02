/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Brain,
  MessageSquareHeart,
  Activity,
  ShieldAlert,
  BarChart3,
  Speech,
  Play,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
  Settings2,
  ArrowRight,
  ShieldCheck,
  Search,
  Upload,
} from 'lucide-react';

import {
  PatientRecord,
  CalculatedKPIs,
  AgentState,
  AgentStatus,
  Agent4PlanOutput,
  Agent1FeedbackOutput,
  Agent2MonitoringOutput,
  Agent3TriageOutput,
  Agent6CommunicationOutput,
  Agent5AnalyticsOutput,
  Agent4DecisionOutput,
} from './types/hospital';

import { DEFAULT_PATIENT_RECORDS } from './data/defaultRecords';
import { calculateHospitalKPIs, extractDistinctComments } from './utils/kpiCalculator';
import { AGENT_PROMPTS, buildAgentPayload } from './prompts/agentPrompts';
import { AgentDiagram } from './components/AgentDiagram';
import { StepReviewBar } from './components/StepReviewBar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { AgentDetailModal } from './components/AgentDetailModal';
import { DataTableModal } from './components/DataTableModal';

const INITIAL_AGENTS_CONFIG: Record<string, AgentState> = {
  agent4: {
    id: 'agent4',
    number: 4,
    order: 1,
    name: 'Agent 4: Decision Support Orchestrator',
    shortName: 'Orchestrator',
    role: 'Team Lead & Final Arbiter',
    status: 'pending',
    accentColor: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    activeInPlan: true,
    task: 'Formulate specialist delegation plan and synthesize final executive recommendations.',
    inputPayload: null,
    outputResult: null,
  },
  agent1: {
    id: 'agent1',
    number: 1,
    order: 2,
    name: 'Agent 1: Patient Feedback Insight',
    shortName: 'Feedback Insight',
    role: 'Theme & Sentiment Specialist',
    status: 'pending',
    accentColor: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    activeInPlan: true,
    task: 'Classify comments into themes, sentiment polarity, and operational processes.',
    inputPayload: null,
    outputResult: null,
  },
  agent2: {
    id: 'agent2',
    number: 2,
    order: 2,
    name: 'Agent 2: Experience Monitoring',
    shortName: 'Experience Monitor',
    role: 'Equity & Pattern Specialist',
    status: 'pending',
    accentColor: 'amber',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-200',
    activeInPlan: true,
    task: 'Detect systemic disparities, age/persona patterns, and healthcare equity risks.',
    inputPayload: null,
    outputResult: null,
  },
  agent3: {
    id: 'agent3',
    number: 3,
    order: 2,
    name: 'Agent 3: Complaint Triage Assistant',
    shortName: 'Complaint Triage',
    role: 'Severity & Routing Specialist',
    status: 'pending',
    accentColor: 'rose',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    activeInPlan: true,
    task: 'Assess severity levels (1-4), identify risks, and escalate human review cases.',
    inputPayload: null,
    outputResult: null,
  },
  agent6: {
    id: 'agent6',
    number: 6,
    order: 2,
    name: 'Agent 6: Healthcare Communication Evaluator',
    shortName: 'Communication Quality',
    role: 'Health Literacy & Patient Message Specialist',
    status: 'pending',
    accentColor: 'violet',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    borderColor: 'border-violet-200',
    activeInPlan: true,
    task: 'Evaluate clarity, empathy, and compose patient-friendly 6th-grade message.',
    inputPayload: null,
    outputResult: null,
  },
  agent5: {
    id: 'agent5',
    number: 5,
    order: 3,
    name: 'Agent 5: Healthcare Analytics Agent',
    shortName: 'Executive Analytics',
    role: 'Leadership Synthesis Specialist',
    status: 'pending',
    accentColor: 'cyan',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    borderColor: 'border-cyan-200',
    activeInPlan: true,
    task: 'Synthesize all specialist findings into executive overview and quick wins.',
    inputPayload: null,
    outputResult: null,
  },
};

export default function App() {
  // Dataset and record selection
  const [records, setRecords] = useState<PatientRecord[]>(DEFAULT_PATIENT_RECORDS);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(() => {
    return new Set(DEFAULT_PATIENT_RECORDS.map((r) => r.Record_ID));
  });

  // Manager Question Input
  const [managerQuestion, setManagerQuestion] = useState(
    'What should management fix first to improve patient experience, and which cases need human review?'
  );

  // Workflow run mode: 'auto' | 'step'
  const [runMode, setRunMode] = useState<'auto' | 'step'>('step');
  const [activeStep, setActiveStep] = useState<number>(0); // 0: Idle, 1: Planning, 2: Specialists, 3: Analytics, 4: Decision, 5: Finished
  const [isPausedForReview, setIsPausedForReview] = useState<boolean>(false);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);

  // Active arrow animation states
  const [dataFlowActive, setDataFlowActive] = useState({
    fromAgent4ToSpecialists: false,
    fromSpecialistsToAgent5: false,
    fromAgent5ToAgent4: false,
  });

  // Agent States
  const [agents, setAgents] = useState<Record<string, AgentState>>(INITIAL_AGENTS_CONFIG);
  const [selectedAgentModalId, setSelectedAgentModalId] = useState<string | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Active records subset
  const activeRecords = useMemo(() => {
    return records.filter((r) => selectedRecordIds.has(r.Record_ID));
  }, [records, selectedRecordIds]);

  // JavaScript KPI calculations
  const kpis: CalculatedKPIs = useMemo(() => {
    return calculateHospitalKPIs(activeRecords);
  }, [activeRecords]);

  // Distinct comments extraction
  const distinctComments = useMemo(() => {
    return extractDistinctComments(activeRecords);
  }, [activeRecords]);

  // Helper to execute single agent server call
  const executeAgentCall = useCallback(
    async (agentId: string, promptKey: string, payload: any) => {
      setAgents((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          status: 'running',
          inputPayload: payload,
          errorMessage: null,
        },
      }));

      try {
        const response = await fetch('/api/agent/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId,
            agentName: agents[agentId]?.name,
            prompt: (AGENT_PROMPTS as any)[promptKey],
            inputData: payload,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Server error occurred');
        }

        setAgents((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: 'completed',
            outputResult: data.result,
          },
        }));

        return data.result;
      } catch (err: any) {
        console.error(`Error running ${agentId}:`, err);
        setAgents((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: 'failed',
            errorMessage: err?.message || 'Agent invocation failed',
          },
        }));
        throw err;
      }
    },
    [agents]
  );

  // Pipeline Step 1: Agent 4 Planning
  const runStep1Planning = async () => {
    setActiveStep(1);
    setIsRunningPipeline(true);
    setDataFlowActive({
      fromAgent4ToSpecialists: false,
      fromSpecialistsToAgent5: false,
      fromAgent5ToAgent4: false,
    });

    const payload = buildAgentPayload('agent4_planning', managerQuestion, activeRecords, kpis, distinctComments);
    try {
      const planResult = await executeAgentCall('agent4', 'agent4_planning', payload);

      // Parse plan and update specialists
      if (planResult?.agents) {
        setAgents((prev) => {
          const updated = { ...prev };
          planResult.agents.forEach((item: any) => {
            const nameLower = (item.agent || '').toLowerCase();
            let targetId = '';
            if (nameLower.includes('feedback') || nameLower.includes('agent 1')) targetId = 'agent1';
            else if (nameLower.includes('monitoring') || nameLower.includes('agent 2')) targetId = 'agent2';
            else if (nameLower.includes('triage') || nameLower.includes('agent 3')) targetId = 'agent3';
            else if (nameLower.includes('communication') || nameLower.includes('agent 6')) targetId = 'agent6';

            if (targetId && updated[targetId]) {
              updated[targetId] = {
                ...updated[targetId],
                activeInPlan: item.run !== false,
                task: item.task || updated[targetId].task,
                reason: item.reason,
                status: item.run === false ? 'skipped' : 'pending',
              };
            }
          });
          return updated;
        });
      }

      if (runMode === 'step') {
        setIsPausedForReview(true);
        setIsRunningPipeline(false);
      } else {
        // Auto run directly proceeds to Step 2
        await runStep2Specialists();
      }
    } catch (err) {
      setIsRunningPipeline(false);
    }
  };

  // Pipeline Step 2: Specialists 1, 2, 3, 6 (Parallel Execution)
  const runStep2Specialists = async () => {
    setActiveStep(2);
    setIsRunningPipeline(true);
    setIsPausedForReview(false);

    // Light up arrows from Agent 4 to Specialists
    setDataFlowActive((prev) => ({ ...prev, fromAgent4ToSpecialists: true }));

    const specialistPromises: Promise<any>[] = [];

    // Agent 1: Feedback Insight
    if (agents.agent1.activeInPlan && agents.agent1.status !== 'completed') {
      const p1 = buildAgentPayload('agent1_feedback', managerQuestion, activeRecords, kpis, distinctComments);
      specialistPromises.push(executeAgentCall('agent1', 'agent1_feedback', p1));
    }

    // Agent 2: Experience Monitoring
    if (agents.agent2.activeInPlan && agents.agent2.status !== 'completed') {
      const p2 = buildAgentPayload('agent2_monitoring', managerQuestion, activeRecords, kpis, distinctComments);
      specialistPromises.push(executeAgentCall('agent2', 'agent2_monitoring', p2));
    }

    // Agent 3: Complaint Triage
    if (agents.agent3.activeInPlan && agents.agent3.status !== 'completed') {
      const p3 = buildAgentPayload('agent3_triage', managerQuestion, activeRecords, kpis, distinctComments);
      specialistPromises.push(executeAgentCall('agent3', 'agent3_triage', p3));
    }

    // Agent 6: Communication Quality
    if (agents.agent6.activeInPlan && agents.agent6.status !== 'completed') {
      const p6 = buildAgentPayload('agent6_communication', managerQuestion, activeRecords, kpis, distinctComments);
      specialistPromises.push(executeAgentCall('agent6', 'agent6_communication', p6));
    }

    try {
      await Promise.allSettled(specialistPromises);

      if (runMode === 'step') {
        setIsPausedForReview(true);
        setIsRunningPipeline(false);
      } else {
        await runStep3Analytics();
      }
    } catch (err) {
      setIsRunningPipeline(false);
    }
  };

  // Pipeline Step 3: Agent 5 Analytics
  const runStep3Analytics = async () => {
    setActiveStep(3);
    setIsRunningPipeline(true);
    setIsPausedForReview(false);

    // Light up arrows from Specialists to Agent 5
    setDataFlowActive((prev) => ({
      ...prev,
      fromAgent4ToSpecialists: false,
      fromSpecialistsToAgent5: true,
    }));

    const payload = buildAgentPayload(
      'agent5_analytics',
      managerQuestion,
      activeRecords,
      kpis,
      distinctComments,
      {
        specialists: {
          agent1: agents.agent1.outputResult,
          agent2: agents.agent2.outputResult,
          agent3: agents.agent3.outputResult,
          agent6: agents.agent6.outputResult,
        },
      }
    );

    try {
      await executeAgentCall('agent5', 'agent5_analytics', payload);

      if (runMode === 'step') {
        setIsPausedForReview(true);
        setIsRunningPipeline(false);
      } else {
        await runStep4Decision();
      }
    } catch (err) {
      setIsRunningPipeline(false);
    }
  };

  // Pipeline Step 4: Agent 4 Final Decision
  const runStep4Decision = async () => {
    setActiveStep(4);
    setIsRunningPipeline(true);
    setIsPausedForReview(false);

    // Light up return loop from Agent 5 to Agent 4
    setDataFlowActive({
      fromAgent4ToSpecialists: false,
      fromSpecialistsToAgent5: false,
      fromAgent5ToAgent4: true,
    });

    const payload = buildAgentPayload(
      'agent4_final',
      managerQuestion,
      activeRecords,
      kpis,
      distinctComments,
      {
        plan: agents.agent4.outputResult,
        analytics: agents.agent5.outputResult,
      }
    );

    try {
      await executeAgentCall('agent4', 'agent4_final', payload);
      setActiveStep(5); // Completed
      setIsRunningPipeline(false);
      setDataFlowActive({
        fromAgent4ToSpecialists: false,
        fromSpecialistsToAgent5: false,
        fromAgent5ToAgent4: false,
      });
    } catch (err) {
      setIsRunningPipeline(false);
    }
  };

  // Handle Approve & Continue in Step-by-Step mode
  const handleApproveAndContinue = () => {
    if (activeStep === 1) {
      runStep2Specialists();
    } else if (activeStep === 2) {
      runStep3Analytics();
    } else if (activeStep === 3) {
      runStep4Decision();
    }
  };

  // Retry individual agent without repeating finished calls
  const handleRetrySingleAgent = async (agentId: string) => {
    if (agentId === 'agent1') {
      const p = buildAgentPayload('agent1_feedback', managerQuestion, activeRecords, kpis, distinctComments);
      await executeAgentCall('agent1', 'agent1_feedback', p);
    } else if (agentId === 'agent2') {
      const p = buildAgentPayload('agent2_monitoring', managerQuestion, activeRecords, kpis, distinctComments);
      await executeAgentCall('agent2', 'agent2_monitoring', p);
    } else if (agentId === 'agent3') {
      const p = buildAgentPayload('agent3_triage', managerQuestion, activeRecords, kpis, distinctComments);
      await executeAgentCall('agent3', 'agent3_triage', p);
    } else if (agentId === 'agent6') {
      const p = buildAgentPayload('agent6_communication', managerQuestion, activeRecords, kpis, distinctComments);
      await executeAgentCall('agent6', 'agent6_communication', p);
    } else if (agentId === 'agent5') {
      const p = buildAgentPayload('agent5_analytics', managerQuestion, activeRecords, kpis, distinctComments, {
        specialists: {
          agent1: agents.agent1.outputResult,
          agent2: agents.agent2.outputResult,
          agent3: agents.agent3.outputResult,
          agent6: agents.agent6.outputResult,
        },
      });
      await executeAgentCall('agent5', 'agent5_analytics', p);
    } else if (agentId === 'agent4') {
      if (activeStep <= 1) {
        await runStep1Planning();
      } else {
        await runStep4Decision();
      }
    }
  };

  // Reset pipeline
  const handleReset = () => {
    setAgents(INITIAL_AGENTS_CONFIG);
    setActiveStep(0);
    setIsPausedForReview(false);
    setIsRunningPipeline(false);
    setDataFlowActive({
      fromAgent4ToSpecialists: false,
      fromSpecialistsToAgent5: false,
      fromAgent5ToAgent4: false,
    });
  };

  // Record selection toggles
  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedRecordIds(new Set(records.map((r) => r.Record_ID)));
  };

  const handleDeselectAll = () => {
    setSelectedRecordIds(new Set());
  };

  const handleImportRecords = (newRecords: PatientRecord[]) => {
    setRecords(newRecords);
    setSelectedRecordIds(new Set(newRecords.map((r) => r.Record_ID)));
    handleReset();
  };

  const handleResetDefaultRecords = () => {
    setRecords(DEFAULT_PATIENT_RECORDS);
    setSelectedRecordIds(new Set(DEFAULT_PATIENT_RECORDS.map((r) => r.Record_ID)));
    handleReset();
  };

  const handleToggleSpecialistActive = (id: string) => {
    setAgents((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        activeInPlan: !prev[id].activeInPlan,
        status: !prev[id].activeInPlan ? 'pending' : 'skipped',
      },
    }));
  };

  const handleUpdateAgentTask = (id: string, task: string) => {
    setAgents((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        task,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Hospital Patient Experience Intelligence System
                </h1>
                <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  6-Agent Collective
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Coordinated clinical governance, complaint triage, and executive decision support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Dataset ({selectedRecordIds.size} / {records.length})</span>
            </button>

            <button
              onClick={handleReset}
              title="Reset System"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Manager Inquiry & Pipeline Controls Banner */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  Hospital Manager Inquiry / Research Objective
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={managerQuestion}
                    onChange={(e) => setManagerQuestion(e.target.value)}
                    disabled={isRunningPipeline}
                    placeholder="Ask a hospital operational question..."
                    className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Mode & Action Controls */}
              <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
                {/* Run Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setRunMode('step')}
                    disabled={isRunningPipeline}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      runMode === 'step'
                        ? 'bg-white text-teal-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Step-by-Step Review
                  </button>
                  <button
                    onClick={() => setRunMode('auto')}
                    disabled={isRunningPipeline}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      runMode === 'auto'
                        ? 'bg-white text-teal-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Auto Run
                  </button>
                </div>

                {/* Primary Execute Button */}
                <button
                  onClick={activeStep === 0 || activeStep === 5 ? runStep1Planning : handleApproveAndContinue}
                  disabled={isRunningPipeline}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                    isRunningPipeline
                      ? 'bg-teal-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 active:scale-98'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isRunningPipeline ? 'animate-spin' : ''}`} />
                  {activeStep === 0
                    ? 'Launch Multi-Agent Analysis'
                    : activeStep === 5
                    ? 'Re-Run Multi-Agent Analysis'
                    : isPausedForReview
                    ? 'Approve & Continue Step'
                    : 'Processing Agents...'}
                </button>
              </div>
            </div>

            {/* Quick Context Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Scope:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {activeRecords.length} Selected Records
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {distinctComments.length} Distinct Comment Clusters
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Satisfaction Avg: <strong>{kpis.avgSatisfaction}/5</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                Follow-up Rate: <strong>{kpis.followupComplianceRate}%</strong>
              </span>
              <span className="ml-auto text-teal-700 font-medium">
                {activeStep === 0 && 'Ready to start'}
                {activeStep === 1 && 'Step 1: Orchestrator Planning'}
                {activeStep === 2 && 'Step 2: Specialists Concurrency'}
                {activeStep === 3 && 'Step 3: Executive Analytics'}
                {activeStep === 4 && 'Step 4: Final Management Decision'}
                {activeStep === 5 && '✓ Full Intelligence Pipeline Complete'}
              </span>
            </div>
          </div>
        </section>

        {/* Step Review Oversight Bar (Visible in step-by-step mode) */}
        <StepReviewBar
          runMode={runMode}
          activeStep={activeStep}
          isPausedForReview={isPausedForReview}
          agents={agents}
          onApproveAndContinue={handleApproveAndContinue}
          onToggleSpecialistActive={handleToggleSpecialistActive}
          onUpdateAgentTask={handleUpdateAgentTask}
          onRetryAgent={handleRetrySingleAgent}
        />

        {/* Dynamic Interactive Agent Diagram */}
        <AgentDiagram
          agents={agents}
          activeStep={activeStep}
          dataFlowActive={dataFlowActive}
          onSelectAgent={(id) => setSelectedAgentModalId(id)}
          selectedAgentId={selectedAgentModalId}
        />

        {/* Executive Management Dashboard */}
        <section className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Executive Leadership Intelligence Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Cross-agent synthesized metrics, risk escalations, and actionable interventions
              </p>
            </div>
            {agents.agent4.outputResult?.answer && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Final Decision Verified
              </span>
            )}
          </div>

          <ExecutiveDashboard
            kpis={kpis}
            records={activeRecords}
            agent4Decision={
              agents.agent4.outputResult?.top_alert || agents.agent4.outputResult?.answer
                ? agents.agent4.outputResult
                : null
            }
            agent1Feedback={agents.agent1.outputResult}
            agent3Triage={agents.agent3.outputResult}
            agent6Comm={agents.agent6.outputResult}
            agent5Analytics={agents.agent5.outputResult}
          />
        </section>
      </main>

      {/* Agent Detail Inspection Modal */}
      {selectedAgentModalId && (
        <AgentDetailModal
          agent={agents[selectedAgentModalId]}
          onClose={() => setSelectedAgentModalId(null)}
          onRetryAgent={handleRetrySingleAgent}
          onUpdateTask={handleUpdateAgentTask}
          canEditTask={activeStep === 1 && isPausedForReview}
        />
      )}

      {/* Dataset & CSV Upload Modal */}
      <DataTableModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        records={records}
        selectedIds={selectedRecordIds}
        onToggleRecord={handleToggleRecord}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onImportRecords={handleImportRecords}
        onResetDefaultRecords={handleResetDefaultRecords}
      />
    </div>
  );
}
