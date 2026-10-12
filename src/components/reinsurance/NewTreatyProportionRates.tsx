// @ts-nocheck
// NewTreatyProportionRates.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTreatyProportions } from "../../hooks/useTreatyProportions";
import { NewTreatyProportionDto } from "../../types/treaty-proportion.types"; // Import from shared types

// ── Static Options ────────────────────────────────────────────────
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2026 - i));

const MAIN_CLASS_OPTIONS = [
  "Engineering",
  "General Accident",
  "Fire & Special Perils",
  "Marine",
  "Motor",
  "Aviation",
  "Oil & Gas",
  "Life",
  "Health",
  "Bond",
];

const REINSURANCE_CO_OPTIONS = [
  "IN-0164,ZENITH GENERAL INS",
  "IN-0001,AFRICAN REINSURANCE",
  "IN-0002,CONTINENTAL REINSURANCE",
  "IN-0003,NIGERIA REINSURANCE",
  "IN-0004,WAICA REINSURANCE",
  "IN-0005,SWISS REINSURANCE",
  "IN-0006,MUNICH REINSURANCE",
];

const LOSS_EXTINCTION_OPTIONS = [
  "select Item",
  "Option A",
  "Option B",
  "Option C",
];

const TABS = [
  { label: "Treaty Distribution", path: "/reinsurance/maintenance/treaty-distribution" },
  { label: "Treaty Proportion Rules", path: "/reinsurance/maintenance/treaty-proportion-rules" },
  { label: "Excess of Loss Treaty Rules", path: "/reinsurance/maintenance/excess-of-loss-treaty-rules" },
  { label: "Fac-Out Auto Distribution Rules", path: "" },
];

// ── Toast ─────────────────────────────────────────────────────────
// In NewTreatyProportionRates.tsx, update the Toast component:

const Toast = ({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    // CHANGE FROM top-4 to top-20
    <div className="fixed top-20 right-4 z-50">
      <div className={`rounded-lg shadow-lg p-4 min-w-[300px] flex items-start gap-3 ${
        type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}>
        {/* Rest remains the same */}
        <div className="flex-shrink-0">
          {type === "success" ? (
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className={`text-sm font-medium flex-1 ${type === "success" ? "text-green-800" : "text-red-800"}`}>
          {message}
        </p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Initial State ─────────────────────────────────────────────────
const initialForm: NewTreatyProportionDto = {
  underYr: "2026",
  mainClass: "Engineering",
  reInsuranceCo: "IN-0164,ZENITH GENERAL INS",
  portfolioPremiumProportion: 0.0,
  commissionRate: 0.0,
  profitCommissionProportion: 0.0,
  mgtExpensesRate: 0.0,
  lossExtinctionLimit: "select Item",
  portfolioLossesProportion: 0.0,
  businessShare: 0.0,
};

// ── Main Component ────────────────────────────────────────────────
const NewTreatyProportionRates: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<NewTreatyProportionDto>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof NewTreatyProportionDto, string>>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Use the treaty proportions hook
  const { createTreatyProportion, isCreating } = useTreatyProportions({
    autoFetch: false, // Don't auto-fetch since this is a create form
  });

  const showToast = (type: "success" | "error", message: string) => setToast({ type, message });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    if (fieldErrors[name as keyof NewTreatyProportionDto]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof NewTreatyProportionDto, string>> = {};
    if (!form.underYr) errors.underYr = "Required";
    if (!form.mainClass) errors.mainClass = "Required";
    if (!form.reInsuranceCo) errors.reInsuranceCo = "Required";
    if (form.commissionRate < 0) errors.commissionRate = "Must be ≥ 0";
    if (form.businessShare < 0 || form.businessShare > 100) errors.businessShare = "Must be 0–100";
    if (form.portfolioPremiumProportion < 0) errors.portfolioPremiumProportion = "Must be ≥ 0";
    if (form.profitCommissionProportion < 0) errors.profitCommissionProportion = "Must be ≥ 0";
    if (form.mgtExpensesRate < 0) errors.mgtExpensesRate = "Must be ≥ 0";
    if (form.portfolioLossesProportion < 0) errors.portfolioLossesProportion = "Must be ≥ 0";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

 // Update the transformToApiPayload function
const transformToApiPayload = () => {
    const [partyID, partyName] = form.reInsuranceCo.split(',');
    const currentUser = localStorage.getItem('username') || 'system';
    
    return {
        subriskID: form.mainClass.charAt(0), // Use first letter as subrisk ID (B, E, F, etc.)
        partyID: partyID,
        underYr: parseInt(form.underYr),
        premRate: form.portfolioPremiumProportion,
        comRate: form.commissionRate,
        profitComm: form.profitCommissionProportion,
        mgtExpenseRate: form.mgtExpensesRate.toString(),
        losslimitRate: form.lossExtinctionLimit === 'select Item' ? '0' : form.lossExtinctionLimit,
        portfolioPrem: form.portfolioPremiumProportion.toString(),
        portfolioLoss: form.portfolioLossesProportion.toString(),
        a1: form.businessShare,
        a2: "",
        tag: form.mainClass,
        submitBy: currentUser,
        modifiedBy: currentUser,
    };
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      const payload = transformToApiPayload();
      const result = await createTreatyProportion(payload);
      
      if (result) {
        showToast("success", "Treaty proportion rates saved successfully!");
        setTimeout(() => navigate("/reinsurance/maintenance/treaty-proportion-rules"), 1500);
      } else {
        showToast("error", "Failed to save treaty proportion rates");
      }
    } catch (err: any) {
      showToast("error", err?.message || "An error occurred while saving");
    }
  };

  const handleCancel = () => navigate("/reinsurance/maintenance/treaty-proportion-rules");

  // ── Style helpers ─────────────────────────────────────────────
  const inputCls = (field: keyof NewTreatyProportionDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field]
        ? "border-red-300 focus:ring-red-200 bg-red-50"
        : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  const selectCls = (field: keyof NewTreatyProportionDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field]
        ? "border-red-300 focus:ring-red-200 bg-red-50"
        : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  // Label + input pair used in grid rows
  const LabelField = ({
    label,
    name,
    required,
    children,
    labelWidth = "w-52",
  }: {
    label: string;
    name: keyof NewTreatyProportionDto;
    required?: boolean;
    children: React.ReactNode;
    labelWidth?: string;
  }) => (
    <div className="flex items-start gap-3">
      <label className={`text-sm text-gray-700 font-medium ${labelWidth} flex-shrink-0 pt-1.5`}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}:
      </label>
      <div className="flex-1 min-w-0">
        {children}
        {fieldErrors[name] && (
          <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Page Title */}
      <div className="mb-4">
        <button
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2 transition-colors"
        >
          ← Back to Treaty Proportion Rules
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Treaty Proportion Rates</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => tab.path && navigate(tab.path)}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 transition-colors ${
                i === 1
                  ? "bg-white border-gray-300 text-gray-800 -mb-px relative z-10 font-semibold"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
              }`}
            >
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
          <span className="text-sm font-semibold text-gray-700">New Treaty Proportion Rates</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-5">

            {/* Row 1: Under Yr (left only) */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <LabelField label="Under Yr" name="underYr" required>
                <select name="underYr" value={form.underYr} onChange={handleChange} className={selectCls("underYr")}>
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </LabelField>
              {/* empty right col */}
              <div />
            </div>

            {/* Row 2: Main Class + Re-Insurance Co */}
            <div className="grid grid-cols-2 gap-x-10">
              <LabelField label="Main Class" name="mainClass" required>
                <select name="mainClass" value={form.mainClass} onChange={handleChange} className={selectCls("mainClass")}>
                  {MAIN_CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelField>
              <LabelField label="Re-Insurance Co." name="reInsuranceCo" required>
                <select name="reInsuranceCo" value={form.reInsuranceCo} onChange={handleChange} className={selectCls("reInsuranceCo")}>
                  {REINSURANCE_CO_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelField>
            </div>

            {/* Row 3: Portfolio Premium Proportion + Commission Rate */}
            <div className="grid grid-cols-2 gap-x-10">
              <LabelField label="Portfolio Premium Proportion" name="portfolioPremiumProportion">
                <input
                  type="number" name="portfolioPremiumProportion"
                  value={form.portfolioPremiumProportion}
                  onChange={handleChange} step="0.01" min="0"
                  className={inputCls("portfolioPremiumProportion")}
                />
              </LabelField>
              <LabelField label="Commission Rate" name="commissionRate">
                <input
                  type="number" name="commissionRate"
                  value={form.commissionRate}
                  onChange={handleChange} step="0.01" min="0"
                  className={inputCls("commissionRate")}
                />
              </LabelField>
            </div>

            {/* Row 4: Profit Commission Proportion + Mgt Expenses Rate */}
            <div className="grid grid-cols-2 gap-x-10">
              <LabelField label="Profit Commission Proportion" name="profitCommissionProportion">
                <input
                  type="number" name="profitCommissionProportion"
                  value={form.profitCommissionProportion}
                  onChange={handleChange} step="0.01" min="0"
                  className={inputCls("profitCommissionProportion")}
                />
              </LabelField>
              <LabelField label="Mgt Expenses Rate" name="mgtExpensesRate">
                <input
                  type="number" name="mgtExpensesRate"
                  value={form.mgtExpensesRate}
                  onChange={handleChange} step="0.01" min="0"
                  className={inputCls("mgtExpensesRate")}
                />
              </LabelField>
            </div>

            {/* Row 5: Loss Extinction Limit + Portfolio Losses Proportion */}
            <div className="grid grid-cols-2 gap-x-10">
              <LabelField label="Loss Extinction Limit" name="lossExtinctionLimit">
                <select name="lossExtinctionLimit" value={form.lossExtinctionLimit} onChange={handleChange} className={selectCls("lossExtinctionLimit")}>
                  {LOSS_EXTINCTION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </LabelField>
              <LabelField label="Portfolio Losses Proportion" name="portfolioLossesProportion">
                <input
                  type="number" name="portfolioLossesProportion"
                  value={form.portfolioLossesProportion}
                  onChange={handleChange} step="0.01" min="0"
                  className={inputCls("portfolioLossesProportion")}
                />
              </LabelField>
            </div>

            {/* Row 6: Business Share (left only) */}
            <div className="grid grid-cols-2 gap-x-10">
              <LabelField label="Business Share (%)" name="businessShare">
                <input
                  type="number" name="businessShare"
                  value={form.businessShare}
                  onChange={handleChange} step="0.01" min="0" max="100"
                  className={inputCls("businessShare")}
                />
              </LabelField>
              <div />
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCreating}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 px-8 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark transition-colors disabled:opacity-70"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTreatyProportionRates;