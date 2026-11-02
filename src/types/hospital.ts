export type ReadmissionRisk = 'Low' | 'Medium' | 'High';

export type AIRiskFlag =
  | 'None'
  | 'Hallucination Risk'
  | 'Bias Review'
  | 'Human Review Required'
  | 'Low Risk'
  | 'High Risk'
  | string;

export interface PatientRecord {
  Record_ID: string;
  Patient_Persona: string;
  Age_Group: string;
  Visit_Type: string;
  Service_Line: string;
  Year: number;
  Patient_Satisfaction: number;
  Communication_Rating: number;
  Followup_Compliance: number; // 0 or 1
  Portal_Usage: number; // 0 or 1
  Readmission_Risk: ReadmissionRisk;
  AI_Risk_Flag: AIRiskFlag;
  Comment: string;
}

export interface DistinctComment {
  id: string;
  comment: string;
  count: number;
  records: string[]; // List of Record_IDs
  avgCommunicationRating: number;
  avgSatisfaction: number;
  aiRiskFlags: Record<string, number>;
}

export interface CalculatedKPIs {
  totalRecords: number;
  avgSatisfaction: number;
  avgCommunication: number;
  followupComplianceRate: number; // percentage 0-100
  portalUsageRate: number; // percentage 0-100
  satisfactionByServiceLine: Record<string, { avg: number; count: number }>;
  satisfactionByYear: Record<number, { avg: number; count: number }>;
  satisfactionByPersona: Record<string, { avg: number; count: number }>;
  satisfactionByVisitType: Record<string, { avg: number; count: number }>;
  readmissionRiskCounts: Record<string, number>;
  aiRiskFlagCounts: Record<string, number>;
  totalHumanReviewCases: number;
  distinctCommentsCount: number;
}

export type AgentStatus =
  | 'pending'
  | 'running'
  | 'waiting_review'
  | 'completed'
  | 'skipped'
  | 'failed';

export interface AgentPlanningItem {
  agent: string;
  run: boolean;
  task: string;
  reason: string;
}

export interface Agent4PlanOutput {
  goal: string;
  agents: AgentPlanningItem[];
}

export interface Agent1FeedbackOutput {
  comments: Array<{
    id: string;
    theme: string;
    sentiment: string;
    reasoning: string;
    operational_issue: string;
    risk_or_bias_concern: string;
    recommended_action: string;
  }>;
  summary: string;
}

export interface Agent2MonitoringOutput {
  patterns: Array<{
    pattern: string;
    evidence: string;
  }>;
  operational_issues: string[];
  equity_concerns: Array<{
    group: string;
    concern: string;
    evidence: string;
  }>;
  risk: {
    patient_safety: string;
    reputational: string;
    compliance: string;
    equity: string;
  };
  recommendation: string;
  additional_information_needed: string;
}

export interface ComplaintItem {
  id: string;
  primary_category: string;
  secondary_categories: string[];
  severity_level: number; // 1, 2, 3, 4
  severity_reasoning: string;
  risks: Array<{ risk: string; why: string }>;
  route_to: string;
  human_review_required: boolean;
  human_review_reason: string;
}

export interface Agent3TriageOutput {
  complaints: ComplaintItem[];
  summary: string;
}

export interface CommunicationEvaluation {
  id: string;
  purpose: string;
  purpose_rationale: string;
  scores: {
    clarity: string;
    completeness: string;
    empathy: string;
    patient_centeredness: string;
    actionability: string;
  };
  health_literacy_concern: string;
  risk: string;
  risk_reason: string;
  improvements: string[];
}

export interface Agent6CommunicationOutput {
  evaluations: CommunicationEvaluation[];
  improved_patient_message: string;
  executive_summary: {
    overall_quality: string;
    major_strengths: string;
    major_weaknesses: string;
    highest_risk: string;
    most_important_improvement: string;
  };
}

export interface Agent5AnalyticsOutput {
  headline: string;
  satisfaction_insights: string[];
  top_themes: string[];
  hidden_problems: Array<{ problem: string; evidence: string }>;
  ai_risk_monitoring: {
    hallucination_trap: string[];
    bias_related: string[];
    human_review: string[];
  };
  top_priorities: string[];
  quick_wins: string[];
  long_term_ai_opportunities: string[];
  additional_information_needed: string;
}

export interface RecommendedAction {
  action: string;
  owner: string;
  timeframe: string;
}

export interface Agent4DecisionOutput {
  top_alert: string;
  answer: string;
  priority: string;
  priority_reason: string;
  recommended_actions: RecommendedAction[];
  human_review: Array<{ item: string; reason: string }>;
}

export interface AgentState {
  id: string;
  number: number; // 1 to 6
  order: number; // Execution order: 1 = Agent 4 Plan, 2 = Specialists, 3 = Agent 5, 4 = Agent 4 Decision
  name: string;
  shortName: string;
  role: string;
  status: AgentStatus;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  activeInPlan: boolean;
  task: string;
  reason?: string;
  inputPayload: any;
  outputResult: any;
  errorMessage?: string | null;
  startedAt?: number;
  completedAt?: number;
}
