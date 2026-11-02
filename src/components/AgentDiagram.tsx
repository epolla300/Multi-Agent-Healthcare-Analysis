import React from 'react';
import {
  Brain,
  MessageSquareHeart,
  Activity,
  ShieldAlert,
  BarChart3,
  Speech,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Send,
  Zap,
} from 'lucide-react';
import { AgentState, AgentStatus } from '../types/hospital';

interface AgentDiagramProps {
  agents: Record<string, AgentState>;
  activeStep: number; // 1: Planning, 2: Specialists, 3: Analytics, 4: Decision, 5: Finished
  dataFlowActive: {
    fromAgent4ToSpecialists: boolean;
    fromSpecialistsToAgent5: boolean;
    fromAgent5ToAgent4: boolean;
  };
  onSelectAgent: (agentId: string) => void;
  selectedAgentId: string | null;
}

export const AgentDiagram: React.FC<AgentDiagramProps> = ({
  agents,
  activeStep,
  dataFlowActive,
  onSelectAgent,
  selectedAgentId,
}) => {
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />
            Running Task
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'waiting_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
            <Clock className="w-3 h-3 text-amber-600 animate-bounce" />
            Needs Review
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Skipped
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending
          </span>
        );
    }
  };

  const agentIcons: Record<string, React.ReactNode> = {
    agent4: <Brain className="w-5 h-5 text-indigo-600" />,
    agent1: <MessageSquareHeart className="w-5 h-5 text-emerald-600" />,
    agent2: <Activity className="w-5 h-5 text-amber-600" />,
    agent3: <ShieldAlert className="w-5 h-5 text-rose-600" />,
    agent6: <Speech className="w-5 h-5 text-violet-600" />,
    agent5: <BarChart3 className="w-5 h-5 text-teal-600" />,
  };

  const renderAgentCard = (id: string, stepBadgeText: string, widthClass = 'w-full') => {
    const agent = agents[id];
    if (!agent) return null;
    const isSelected = selectedAgentId === id;
    const isRunning = agent.status === 'running';

    return (
      <div
        onClick={() => onSelectAgent(id)}
        className={`relative group cursor-pointer transition-all duration-300 rounded-xl p-4 bg-white border ${
          isSelected
            ? 'ring-2 ring-teal-500 ring-offset-2 border-teal-500 shadow-md'
            : isRunning
            ? 'border-teal-400 shadow-md ring-1 ring-teal-300'
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
        } ${widthClass}`}
      >
        {/* Active execution glow & dynamic halo when processing own task */}
        {isRunning && (
          <div className="absolute inset-0 rounded-xl bg-teal-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Dynamic task execution particle indicator */}
        {isRunning && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 items-center justify-center text-[9px] text-white font-bold">
              ⚡
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${agent.badgeBg} ${agent.borderColor}`}
            >
              {agentIcons[id]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {stepBadgeText}
                </span>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                  {agent.shortName}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{agent.role}</p>
            </div>
          </div>
          <div>{getStatusBadge(agent.status)}</div>
        </div>

        {/* Task preview snippet */}
        <div className="mt-2.5 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-600 line-clamp-2 italic">
            "{agent.task || 'Awaiting assignment from Orchestrator'}"
          </p>
        </div>

        {/* Internal task execution indicator */}
        {isRunning && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-teal-700 font-medium bg-teal-50/80 px-2.5 py-1 rounded-md border border-teal-100 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-teal-600 shrink-0" />
            <span>Processing healthcare data model...</span>
          </div>
        )}

        {/* Bottom card action hint */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
          <span className="flex items-center gap-1 font-medium">
            <Eye className="w-3.5 h-3.5" />
            Click to inspect
          </span>
          {agent.outputResult && (
            <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded text-[10px] border border-teal-100">
              Output Ready
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-sm overflow-hidden">
      {/* Header with Title and Diagram Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Multi-Agent Healthcare Coordination Network
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline: Orchestrator plans → 4 Specialists evaluate in parallel → Analytics synthesizes → Final Decision
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
            Live Flow
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Orchestrator
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            Specialists
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Analytics
          </span>
        </div>
      </div>

      {/* SVG Canvas for Dynamic Arrows */}
      <div className="relative">
        {/* Dynamic Canvas Connection Paths */}
        <div className="hidden lg:block pointer-events-none absolute inset-0 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="flowGradientTeal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="flowGradientReturn" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
              </linearGradient>
              <filter id="glowTeal" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Top Dispatch Flow: Agent 4 to Specialists 1, 2, 3, 6 */}
            <path
              d="M 50% 120 L 50% 150 L 12% 150 L 12% 180"
              fill="none"
              stroke={dataFlowActive.fromAgent4ToSpecialists ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromAgent4ToSpecialists ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromAgent4ToSpecialists ? '5 5' : 'none'}
              className={dataFlowActive.fromAgent4ToSpecialists ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 50% 120 L 50% 150 L 37% 150 L 37% 180"
              fill="none"
              stroke={dataFlowActive.fromAgent4ToSpecialists ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromAgent4ToSpecialists ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromAgent4ToSpecialists ? '5 5' : 'none'}
              className={dataFlowActive.fromAgent4ToSpecialists ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 50% 120 L 50% 150 L 63% 150 L 63% 180"
              fill="none"
              stroke={dataFlowActive.fromAgent4ToSpecialists ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromAgent4ToSpecialists ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromAgent4ToSpecialists ? '5 5' : 'none'}
              className={dataFlowActive.fromAgent4ToSpecialists ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 50% 120 L 50% 150 L 88% 150 L 88% 180"
              fill="none"
              stroke={dataFlowActive.fromAgent4ToSpecialists ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromAgent4ToSpecialists ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromAgent4ToSpecialists ? '5 5' : 'none'}
              className={dataFlowActive.fromAgent4ToSpecialists ? 'animate-[dash_1s_linear_infinite]' : ''}
            />

            {/* Specialist to Agent 5 Converging Flow */}
            <path
              d="M 12% 340 L 12% 370 L 50% 370 L 50% 400"
              fill="none"
              stroke={dataFlowActive.fromSpecialistsToAgent5 ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromSpecialistsToAgent5 ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromSpecialistsToAgent5 ? '5 5' : 'none'}
              className={dataFlowActive.fromSpecialistsToAgent5 ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 37% 340 L 37% 370 L 50% 370 L 50% 400"
              fill="none"
              stroke={dataFlowActive.fromSpecialistsToAgent5 ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromSpecialistsToAgent5 ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromSpecialistsToAgent5 ? '5 5' : 'none'}
              className={dataFlowActive.fromSpecialistsToAgent5 ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 63% 340 L 63% 370 L 50% 370 L 50% 400"
              fill="none"
              stroke={dataFlowActive.fromSpecialistsToAgent5 ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromSpecialistsToAgent5 ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromSpecialistsToAgent5 ? '5 5' : 'none'}
              className={dataFlowActive.fromSpecialistsToAgent5 ? 'animate-[dash_1s_linear_infinite]' : ''}
            />
            <path
              d="M 88% 340 L 88% 370 L 50% 370 L 50% 400"
              fill="none"
              stroke={dataFlowActive.fromSpecialistsToAgent5 ? '#0d9488' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromSpecialistsToAgent5 ? 2.5 : 1.5}
              strokeDasharray={dataFlowActive.fromSpecialistsToAgent5 ? '5 5' : 'none'}
              className={dataFlowActive.fromSpecialistsToAgent5 ? 'animate-[dash_1s_linear_infinite]' : ''}
            />

            {/* Return Loop: Agent 5 (Bottom) back up to Agent 4 (Top) */}
            <path
              d="M 70% 460 C 98% 460, 98% 60, 68% 60"
              fill="none"
              stroke={dataFlowActive.fromAgent5ToAgent4 ? '#6366f1' : '#cbd5e1'}
              strokeWidth={dataFlowActive.fromAgent5ToAgent4 ? 3 : 1.5}
              strokeDasharray={dataFlowActive.fromAgent5ToAgent4 ? '6 4' : '4 4'}
              className={dataFlowActive.fromAgent5ToAgent4 ? 'animate-[dash_0.8s_linear_infinite]' : ''}
              filter={dataFlowActive.fromAgent5ToAgent4 ? 'url(#glowTeal)' : 'none'}
            />
          </svg>
        </div>

        {/* Dynamic Nodes Container */}
        <div className="relative z-10 space-y-6">
          {/* LEVEL 1: Top - Agent 4 (Orchestrator) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              {renderAgentCard('agent4', 'Step 1 & Step 4: Leader')}
            </div>

            {/* Downward dispatch indicator with active pulses */}
            <div className="flex items-center justify-center my-2 gap-2 text-xs font-semibold text-teal-700">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition-all duration-300 ${
                  dataFlowActive.fromAgent4ToSpecialists
                    ? 'bg-teal-100 text-teal-800 shadow-sm border border-teal-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    dataFlowActive.fromAgent4ToSpecialists ? 'text-teal-600 animate-bounce' : 'text-slate-400'
                  }`}
                />
                1. Plan & Task Delegation Dispatch
              </span>
            </div>
          </div>

          {/* LEVEL 2: Middle - Specialists 1, 2, 3, 6 */}
          <div>
            <div className="text-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Step 2: Concurrent Specialist Analysis
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {renderAgentCard('agent1', 'Order 2')}
              {renderAgentCard('agent2', 'Order 2')}
              {renderAgentCard('agent3', 'Order 2')}
              {renderAgentCard('agent6', 'Order 2')}
            </div>

            {/* Converging Arrow to Agent 5 */}
            <div className="flex items-center justify-center my-3 gap-2 text-xs font-semibold text-teal-700">
              <span
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] transition-all duration-300 ${
                  dataFlowActive.fromSpecialistsToAgent5
                    ? 'bg-teal-100 text-teal-800 shadow-sm border border-teal-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}
              >
                <Send
                  className={`w-3.5 h-3.5 ${
                    dataFlowActive.fromSpecialistsToAgent5 ? 'text-teal-600 animate-pulse' : 'text-slate-400'
                  }`}
                />
                2. Specialists Forward Findings to Analytics
              </span>
            </div>
          </div>

          {/* LEVEL 3: Bottom - Agent 5 (Healthcare Analytics) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-md">
              {renderAgentCard('agent5', 'Step 3: Executive Analytics')}
            </div>

            {/* Feedback Return Arrow to Agent 4 */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
                  dataFlowActive.fromAgent5ToAgent4
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    dataFlowActive.fromAgent5ToAgent4 ? 'text-indigo-600 animate-spin' : 'text-slate-400'
                  }`}
                />
                3. Insights Flow Back to Agent 4 for Final Decision Support
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
