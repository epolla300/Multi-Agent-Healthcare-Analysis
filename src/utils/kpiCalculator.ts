import { PatientRecord, CalculatedKPIs, DistinctComment } from '../types/hospital';

/**
 * Calculates all KPIs strictly in JavaScript as required by the specification:
 * - Total number of records
 * - Average Patient_Satisfaction
 * - Average Communication_Rating
 * - Follow-up rate (Followup_Compliance = 1)
 * - Portal use rate (Portal_Usage = 1)
 * - Average satisfaction by Service_Line and by Year
 * - Counts by Readmission_Risk and AI_Risk_Flag
 */
export function calculateHospitalKPIs(records: PatientRecord[]): CalculatedKPIs {
  if (!records || records.length === 0) {
    return {
      totalRecords: 0,
      avgSatisfaction: 0,
      avgCommunication: 0,
      followupComplianceRate: 0,
      portalUsageRate: 0,
      satisfactionByServiceLine: {},
      satisfactionByYear: {},
      satisfactionByPersona: {},
      satisfactionByVisitType: {},
      readmissionRiskCounts: {},
      aiRiskFlagCounts: {},
      totalHumanReviewCases: 0,
      distinctCommentsCount: 0,
    };
  }

  const n = records.length;
  let totalSat = 0;
  let totalComm = 0;
  let followupCount = 0;
  let portalCount = 0;
  let humanReviewCases = 0;

  const satByService: Record<string, { total: number; count: number }> = {};
  const satByYear: Record<number, { total: number; count: number }> = {};
  const satByPersona: Record<string, { total: number; count: number }> = {};
  const satByVisitType: Record<string, { total: number; count: number }> = {};
  const readmissionCounts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
  const aiRiskCounts: Record<string, number> = {};

  records.forEach((r) => {
    const sat = Number(r.Patient_Satisfaction) || 0;
    const comm = Number(r.Communication_Rating) || 0;
    totalSat += sat;
    totalComm += comm;

    if (Number(r.Followup_Compliance) === 1) followupCount++;
    if (Number(r.Portal_Usage) === 1) portalCount++;

    const isHumanReview =
      r.AI_Risk_Flag === 'Human Review Required' ||
      r.AI_Risk_Flag === 'Hallucination Risk' ||
      r.AI_Risk_Flag === 'Bias Review' ||
      r.Readmission_Risk === 'High';
    if (isHumanReview) humanReviewCases++;

    // Service line
    if (!satByService[r.Service_Line]) {
      satByService[r.Service_Line] = { total: 0, count: 0 };
    }
    satByService[r.Service_Line].total += sat;
    satByService[r.Service_Line].count += 1;

    // Year
    const year = Number(r.Year) || 2025;
    if (!satByYear[year]) {
      satByYear[year] = { total: 0, count: 0 };
    }
    satByYear[year].total += sat;
    satByYear[year].count += 1;

    // Persona
    if (!satByPersona[r.Patient_Persona]) {
      satByPersona[r.Patient_Persona] = { total: 0, count: 0 };
    }
    satByPersona[r.Patient_Persona].total += sat;
    satByPersona[r.Patient_Persona].count += 1;

    // Visit type
    if (!satByVisitType[r.Visit_Type]) {
      satByVisitType[r.Visit_Type] = { total: 0, count: 0 };
    }
    satByVisitType[r.Visit_Type].total += sat;
    satByVisitType[r.Visit_Type].count += 1;

    // Readmission risk
    const rRisk = r.Readmission_Risk || 'Low';
    readmissionCounts[rRisk] = (readmissionCounts[rRisk] || 0) + 1;

    // AI risk flag
    const flag = r.AI_Risk_Flag || 'None';
    aiRiskCounts[flag] = (aiRiskCounts[flag] || 0) + 1;
  });

  const satisfactionByServiceLine: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(satByService)) {
    satisfactionByServiceLine[k] = {
      avg: Number((v.total / v.count).toFixed(2)),
      count: v.count,
    };
  }

  const satisfactionByYear: Record<number, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(satByYear)) {
    satisfactionByYear[Number(k)] = {
      avg: Number((v.total / v.count).toFixed(2)),
      count: v.count,
    };
  }

  const satisfactionByPersona: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(satByPersona)) {
    satisfactionByPersona[k] = {
      avg: Number((v.total / v.count).toFixed(2)),
      count: v.count,
    };
  }

  const satisfactionByVisitType: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(satByVisitType)) {
    satisfactionByVisitType[k] = {
      avg: Number((v.total / v.count).toFixed(2)),
      count: v.count,
    };
  }

  const distinctComments = extractDistinctComments(records);

  return {
    totalRecords: n,
    avgSatisfaction: Number((totalSat / n).toFixed(2)),
    avgCommunication: Number((totalComm / n).toFixed(2)),
    followupComplianceRate: Number(((followupCount / n) * 100).toFixed(1)),
    portalUsageRate: Number(((portalCount / n) * 100).toFixed(1)),
    satisfactionByServiceLine,
    satisfactionByYear,
    satisfactionByPersona,
    satisfactionByVisitType,
    readmissionRiskCounts: readmissionCounts,
    aiRiskFlagCounts: aiRiskCounts,
    totalHumanReviewCases: humanReviewCases,
    distinctCommentsCount: distinctComments.length,
  };
}

/**
 * Groups identical comments, counts their appearances, lists record IDs,
 * and calculates average ratings and AI Risk flag breakdowns.
 * This ensures comments are sent to agents once with counts.
 */
export function extractDistinctComments(records: PatientRecord[]): DistinctComment[] {
  const map = new Map<string, {
    comment: string;
    records: string[];
    totalComm: number;
    totalSat: number;
    flags: Record<string, number>;
  }>();

  records.forEach((r) => {
    const rawComment = (r.Comment || '').trim();
    if (!rawComment) return;

    if (!map.has(rawComment)) {
      map.set(rawComment, {
        comment: rawComment,
        records: [],
        totalComm: 0,
        totalSat: 0,
        flags: {},
      });
    }

    const entry = map.get(rawComment)!;
    entry.records.push(r.Record_ID);
    entry.totalComm += Number(r.Communication_Rating) || 0;
    entry.totalSat += Number(r.Patient_Satisfaction) || 0;
    const flag = r.AI_Risk_Flag || 'None';
    entry.flags[flag] = (entry.flags[flag] || 0) + 1;
  });

  const result: DistinctComment[] = [];
  let index = 1;
  for (const [_commentText, data] of map.entries()) {
    result.push({
      id: `C${index}`,
      comment: data.comment,
      count: data.records.length,
      records: data.records,
      avgCommunicationRating: Number((data.totalComm / data.records.length).toFixed(1)),
      avgSatisfaction: Number((data.totalSat / data.records.length).toFixed(1)),
      aiRiskFlags: data.flags,
    });
    index++;
  }

  return result;
}

/**
 * Formats groupings required for Agent 2:
 * averages and counts calculated by the app, grouped by Patient_Persona, Age_Group,
 * Visit_Type, Service_Line, and Year.
 */
export function calculateDemographicBreakdowns(records: PatientRecord[]) {
  const groupBy = (key: keyof PatientRecord) => {
    const map: Record<string, { count: number; totalSat: number; totalComm: number; followup: number; portal: number }> = {};
    records.forEach((r) => {
      const val = String(r[key]);
      if (!map[val]) {
        map[val] = { count: 0, totalSat: 0, totalComm: 0, followup: 0, portal: 0 };
      }
      map[val].count++;
      map[val].totalSat += Number(r.Patient_Satisfaction) || 0;
      map[val].totalComm += Number(r.Communication_Rating) || 0;
      if (Number(r.Followup_Compliance) === 1) map[val].followup++;
      if (Number(r.Portal_Usage) === 1) map[val].portal++;
    });

    const summary: Record<string, any> = {};
    for (const [k, v] of Object.entries(map)) {
      summary[k] = {
        record_count: v.count,
        avg_patient_satisfaction: Number((v.totalSat / v.count).toFixed(2)),
        avg_communication_rating: Number((v.totalComm / v.count).toFixed(2)),
        followup_compliance_rate: `${((v.followup / v.count) * 100).toFixed(1)}%`,
        portal_usage_rate: `${((v.portal / v.count) * 100).toFixed(1)}%`,
      };
    }
    return summary;
  };

  return {
    by_patient_persona: groupBy('Patient_Persona'),
    by_age_group: groupBy('Age_Group'),
    by_visit_type: groupBy('Visit_Type'),
    by_service_line: groupBy('Service_Line'),
    by_year: groupBy('Year'),
  };
}
