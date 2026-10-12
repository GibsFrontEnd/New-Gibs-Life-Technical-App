//@ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────
interface RiskProfileRangeDto {
  underYr: string;
  subClass: string;
  range1Amount: number;
  range2Amount: number;
  remarks: string;
}

const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2026 - i));

const SUB_CLASS_OPTIONS = [
  "PRIVATE MOTOR - ENHANCED",
  "PRIVATE MOTOR - STANDARD",
  "COMMERCIAL MOTOR",
  "FIRE & SPECIAL PERILS",
  "BURGLARY INSURANCE - PRI",
  "MARINE CARGO",
  "ENGINEERING - CAR",
  "AVIATION HULL",
  "PERSONAL ACCIDENT",
  "GROUP LIFE",
  "FIDELITY GUARANTEE",
];

// These tabs are specific to the Bond Quota Share Rates / Risk Profile / Loss Ratio group
const TABS = [
  { label: "Bond Quota Share Rates", path: "/reinsurance/maintenance/bond-quota-share-rates" },
  { label: "Risk Profile Ranges", path: "/reinsurance/maintenance/risk-profile-ranges" },
  { label: "Treaty Loss Ratio Range", path: "/reinsurance/maintenance/loss-ratio-range" },
];

// ── Toast ─────────────────────────────────────────────────────────
const Toast = ({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 min-w-[300px] flex items-start gap-3 ${type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className="flex-shrink-0">
          {type === "success"
            ? <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
        </div>
        <p className={`text-sm font-medium flex-1 ${type === "success" ? "text-green-800" : "text-red-800"}`}>{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

// ── Initial State ─────────────────────────────────────────────────
const initialForm: RiskProfileRangeDto = {
  underYr: "2026",
  subClass: "PRIVATE MOTOR - ENHANCED",
  range1Amount: 0.0,
  range2Amount: 0.0,
  remarks: "",
};

// ── Main Component ────────────────────────────────────────────────
const RiskProfileRanges: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RiskProfileRangeDto>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RiskProfileRangeDto, string>>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
    if (fieldErrors[name as keyof RiskProfileRangeDto]) setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof RiskProfileRangeDto, string>> = {};
    if (!form.underYr) errors.underYr = "Required";
    if (!form.subClass) errors.subClass = "Required";
    if (form.range1Amount < 0) errors.range1Amount = "Must be ≥ 0";
    if (form.range2Amount < 0) errors.range2Amount = "Must be ≥ 0";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      setToast({ type: "success", message: "Risk profile range saved successfully!" });
      setTimeout(() => navigate("/reinsurance/maintenance/risk-profile-ranges"), 1500);
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "An error occurred" });
    } finally { setLoading(false); }
  };

  const handleCancel = () => navigate("/reinsurance/maintenance/risk-profile-ranges");

  const inputCls = (field: keyof RiskProfileRangeDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  const selectCls = (field: keyof RiskProfileRangeDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  const LabelField = ({ label, name, children }: {
    label: string; name: keyof RiskProfileRangeDto; children: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3">
      <label className="text-sm text-gray-700 font-medium w-36 flex-shrink-0 pt-1.5">{label}:</label>
      <div className="flex-1 min-w-0">
        {children}
        {fieldErrors[name] && <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Title */}
      <div className="mb-4">
        <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2 transition-colors">
          ← Back to Risk Profile Ranges
        </button>
        <h1 className="text-2xl font-bold text-gray-800">New/Edit Risk Profile Range</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button key={tab.label} onClick={() => tab.path && navigate(tab.path)}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 transition-colors ${
                i === 1
                  ? "bg-white border-gray-300 text-gray-800 -mb-px relative z-10 font-semibold"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">

        {/* Section Header */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-200 bg-gray-50">
          <span className="text-gray-500 text-sm font-bold">⊟</span>
          <span className="text-sm font-semibold text-gray-700">New Risk Profile Range</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-5">

            {/* Under Yr */}
            <LabelField label="Under Yr" name="underYr">
              <select name="underYr" value={form.underYr} onChange={handleChange} className={`${selectCls("underYr")} max-w-[200px]`}>
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </LabelField>

            {/* Sub Class */}
            <LabelField label="Sub Class" name="subClass">
              <select name="subClass" value={form.subClass} onChange={handleChange} className={`${selectCls("subClass")} max-w-[280px]`}>
                {SUB_CLASS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </LabelField>

            {/* Range1 Amount */}
            <LabelField label="Range1 Amount" name="range1Amount">
              <input type="number" name="range1Amount" value={form.range1Amount} onChange={handleChange}
                step="0.01" min="0" className={`${inputCls("range1Amount")} max-w-[200px]`} />
            </LabelField>

            {/* Range2 Amount */}
            <LabelField label="Range2 Amount" name="range2Amount">
              <input type="number" name="range2Amount" value={form.range2Amount} onChange={handleChange}
                step="0.01" min="0" className={`${inputCls("range2Amount")} max-w-[200px]`} />
            </LabelField>

            {/* Remarks */}
            <LabelField label="Remarks" name="remarks">
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                rows={3}
                className={`w-full max-w-[280px] px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 transition-colors resize-y ${
                  fieldErrors.remarks ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
                }`}
              />
            </LabelField>

          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button type="button" onClick={handleCancel} disabled={loading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-8 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark transition-colors disabled:opacity-70">
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Submit</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskProfileRanges;