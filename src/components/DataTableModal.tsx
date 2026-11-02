import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  Download,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertCircle,
  X,
} from 'lucide-react';
import { PatientRecord } from '../types/hospital';
import { DEFAULT_PATIENT_RECORDS } from '../data/defaultRecords';

interface DataTableModalProps {
  records: PatientRecord[];
  selectedIds: Set<string>;
  onToggleRecord: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onImportRecords: (newRecords: PatientRecord[]) => void;
  onResetDefaultRecords: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const DataTableModal: React.FC<DataTableModalProps> = ({
  records,
  selectedIds,
  onToggleRecord,
  onSelectAll,
  onDeselectAll,
  onImportRecords,
  onResetDefaultRecords,
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const serviceLines = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => r.Service_Line && set.add(r.Service_Line));
    return Array.from(set).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.Record_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.Comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.Patient_Persona.toLowerCase().includes(searchTerm.toLowerCase());

      const matchService =
        serviceFilter === 'ALL' || r.Service_Line === serviceFilter;

      const matchRisk =
        riskFilter === 'ALL' || r.AI_Risk_Flag === riskFilter;

      return matchSearch && matchService && matchRisk;
    });
  }, [records, searchTerm, serviceFilter, riskFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = results.data.map((row: any, idx: number): PatientRecord => {
            return {
              Record_ID: row.Record_ID || row.id || `REC-${1000 + idx}`,
              Patient_Persona: row.Patient_Persona || row.persona || 'General Patient',
              Age_Group: row.Age_Group || row.age || '51-64',
              Visit_Type: row.Visit_Type || row.visit_type || 'Outpatient',
              Service_Line: row.Service_Line || row.service_line || 'General Medicine',
              Year: Number(row.Year) || 2025,
              Patient_Satisfaction: Number(row.Patient_Satisfaction) || 3,
              Communication_Rating: Number(row.Communication_Rating) || 3,
              Followup_Compliance: Number(row.Followup_Compliance) === 1 ? 1 : 0,
              Portal_Usage: Number(row.Portal_Usage) === 1 ? 1 : 0,
              Readmission_Risk: (row.Readmission_Risk as any) || 'Low',
              AI_Risk_Flag: row.AI_Risk_Flag || 'None',
              Comment: row.Comment || row.comment || 'Routine consultation.',
            };
          });

          if (parsed.length === 0) {
            setUploadError('No valid rows found in the uploaded CSV.');
            return;
          }

          onImportRecords(parsed);
        } catch (err: any) {
          setUploadError(`Failed to parse CSV records: ${err.message}`);
        }
      },
      error: (error) => {
        setUploadError(`CSV Parse Error: ${error.message}`);
      },
    });
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hospital_patient_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Patient Experience Dataset Management
              </h3>
              <p className="text-xs text-slate-500">
                {selectedIds.size} of {records.length} records selected for multi-agent evaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              Upload CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Download CSV
            </button>

            <button
              onClick={onResetDefaultRecords}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              Reset Default
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {/* Filter and Selection Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
              Select All
            </button>
            <button
              onClick={onDeselectAll}
              className="flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search comment or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 w-44"
              />
            </div>

            {/* Service Line Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md py-1 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Service Lines</option>
              {serviceLines.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Risk Flag Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md py-1 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All AI Risk Flags</option>
              <option value="Human Review Required">Human Review Required</option>
              <option value="Hallucination Risk">Hallucination Risk</option>
              <option value="Bias Review">Bias Review</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 uppercase font-semibold text-[10px] sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-10">Select</th>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Service Line</th>
                <th className="py-2.5 px-3">Persona / Age</th>
                <th className="py-2.5 px-3">Sat / Comm</th>
                <th className="py-2.5 px-3">Followup / Portal</th>
                <th className="py-2.5 px-3">AI Risk Flag</th>
                <th className="py-2.5 px-3">Patient Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map((r) => {
                const isChecked = selectedIds.has(r.Record_ID);
                return (
                  <tr
                    key={r.Record_ID}
                    onClick={() => onToggleRecord(r.Record_ID)}
                    className={`cursor-pointer transition-colors ${
                      isChecked ? 'bg-teal-50/20 hover:bg-teal-50/40' : 'bg-white hover:bg-slate-50 text-slate-400'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by row onClick
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {r.Record_ID}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800">
                        {r.Service_Line}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.Patient_Persona} ({r.Age_Group})
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{r.Patient_Satisfaction}</span> /{' '}
                      <span className="font-medium text-slate-600">{r.Communication_Rating}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.Followup_Compliance === 1 ? 'Followup: Yes' : 'No'} |{' '}
                      {r.Portal_Usage === 1 ? 'Portal: Yes' : 'No'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          r.AI_Risk_Flag === 'Hallucination Risk'
                            ? 'bg-rose-100 text-rose-800'
                            : r.AI_Risk_Flag === 'Human Review Required'
                            ? 'bg-amber-100 text-amber-800'
                            : r.AI_Risk_Flag === 'Bias Review'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {r.AI_Risk_Flag}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 line-clamp-1 max-w-sm">
                      {r.Comment}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing {filteredRecords.length} records ({selectedIds.size} active in analysis)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
