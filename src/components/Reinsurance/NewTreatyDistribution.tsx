// pages/NewTreatyDistribution.tsx
//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRiskDistribution } from "../../hooks/useRiskDistribution";
import { CreateRiskDistributionDto } from "../../types/riskDistribution";

// ── Static Options ────────────────────────────────────────────────
const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2026 - i));

const MAIN_CLASS_OPTIONS = [
  "General Accident",
  "Fire & Special Perils",
  "Marine",
  "Motor",
  "Engineering",
  "Aviation",
  "Oil & Gas",
  "Life",
  "Health",
  "Bond",
];

const SUB_CLASS_OPTIONS = [
  "BURGLARY INSURANCE - PRI",
  "FIRE & SPECIAL PERILS",
  "MARINE CARGO",
  "MOTOR PRIVATE",
  "MOTOR COMMERCIAL",
  "ENGINEERING - CAR",
  "AVIATION HULL",
  "PERSONAL ACCIDENT",
  "GROUP LIFE",
  "FIDELITY GUARANTEE",
];

const TABS = [
  "Treaty Distribution",
  "Treaty Proportion Rules",
  "Excess of Loss Treaty Rules",
  "Fac-Out Auto Distribution Rules",
];

const Toast = ({ type, message, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`rounded-lg shadow-lg p-4 min-w-[320px] flex items-start gap-3 ${
        type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}>
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
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── Initial Form State ────────────────────────────────────────────
const initialForm: CreateRiskDistributionDto = {
  subRiskID: "F",
  underYr: "2026",
  cessionRate: 0,
  retention: 0,
  surplus1: 0,
  surplus2: 0,
  lineNos: 0,
  tag: "",
  submitBy: "user",
  submitOn: new Date().toISOString(),
  modifiedBy: null,
  modifiedOn: null,
};

// ── Main Component ────────────────────────────────────────────────
const NewTreatyDistribution: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    create, 
    update, 
    getById,  // This dispatches an action
    selectedItem,  // This contains the fetched data from Redux
    loading: hookLoading,
    error 
  } = useRiskDistribution();
  
  const isEdit = !!id && !window.location.pathname.includes("/view/");
  const isView = window.location.pathname.includes("/view/");
  
  const [form, setForm] = useState<CreateRiskDistributionDto>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateRiskDistributionDto, string>>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit || isView);
  
  const loading = localLoading || hookLoading;

  // Load data if in edit/view mode
  useEffect(() => {
    if (isEdit || isView) {
      // Dispatch the action to fetch data
      getById(parseInt(id));
    }
  }, [id, isEdit, isView]);

  // Watch for selectedItem changes from Redux
  useEffect(() => {
    if (selectedItem && (isEdit || isView)) {
      // Populate form with fetched data
      setForm({
        subRiskID: selectedItem.subRiskID,
        underYr: selectedItem.underYr,
        cessionRate: selectedItem.cessionRate,
        retention: selectedItem.retention,
        surplus1: selectedItem.surplus1,
        surplus2: selectedItem.surplus2 || 0,
        lineNos: selectedItem.lineNos,
        tag: selectedItem.tag || "",
        submitBy: selectedItem.submitBy,
        submitOn: selectedItem.submitOn,
        modifiedBy: selectedItem.modifiedBy,
        modifiedOn: selectedItem.modifiedOn,
      });
      setLoadingData(false);
    }
  }, [selectedItem, isEdit, isView]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      showToast("error", error);
      setLoadingData(false);
    }
  }, [error]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let dtoName = name;
    let dtoValue: any = type === "number" ? Number(value) : value;
    
    if (name === "mainClass") {
      dtoName = "mainClass";
    } else if (name === "subClass") {
      dtoName = "subRiskID";
    } else if (name === "retentionCapacity") {
      dtoName = "retention";
    } else if (name === "firstSurplusValue") {
      dtoName = "surplus1";
    } else if (name === "mplBaseOption") {
      dtoName = "surplus2";
    }
    
    setForm((prev) => ({
      ...prev,
      [dtoName]: dtoValue,
      ...(dtoName === "subRiskID" && { tag: dtoValue }),
    }));
    
    if (fieldErrors[dtoName as keyof CreateRiskDistributionDto]) {
      setFieldErrors((prev) => ({ ...prev, [dtoName]: "" }));
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateRiskDistributionDto, string>> = {};
    if (!form.underYr) errors.underYr = "Under Year is required";
    if (!form.subRiskID) errors.subRiskID = "Sub Class is required";
    if (form.cessionRate < 0) errors.cessionRate = "Cession Rate must be ≥ 0";
    if (form.retention < 0) errors.retention = "Retention Capacity must be ≥ 0";
    if (form.lineNos < 0) errors.lineNos = "Line Nos must be ≥ 0";
    if (form.surplus1 < 0) errors.surplus1 = "1st Surplus Value must be ≥ 0";
    if (form.surplus2 < 0) errors.surplus2 = "MPL Base Option must be ≥ 0";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    if (!validate()) return;
    
    setLocalLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("unEncryptedUser") || "{}");
      const username = currentUser?.username || currentUser?.userName || currentUser?.name || "system";
      
      const submitData: CreateRiskDistributionDto = {
        subRiskID: form.subRiskID,
        underYr: form.underYr,
        cessionRate: Number(form.cessionRate),
        retention: Number(form.retention),
        surplus1: Number(form.surplus1),
        surplus2: Number(form.surplus2) || 0,
        lineNos: Number(form.lineNos),
        tag: form.tag || form.subRiskID,
        submitBy: username,
        modifiedBy: username,
      };
      
      if (isEdit) {
        await update(parseInt(id), submitData);
        showToast("success", "✅ Treaty distribution updated successfully!");
      } else {
        await create(submitData);
        showToast("success", "✅ Treaty distribution created successfully!");
      }
      
      setTimeout(() => {
        navigate("/reinsurance/maintenance/treaty-distribution");
      }, 1500);
    } catch (err: any) {
      console.error("Submission error:", err);
      showToast("error", err?.message || "❌ Failed to save treaty distribution");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => navigate("/reinsurance/maintenance/treaty-distribution");

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Styles
  const inputCls = (field: keyof CreateRiskDistributionDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      isView ? "bg-gray-50 cursor-not-allowed" : ""
    } ${
      fieldErrors[field]
        ? "border-red-300 focus:ring-red-200 bg-red-50"
        : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  const selectCls = (field: keyof CreateRiskDistributionDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      isView ? "bg-gray-50 cursor-not-allowed" : ""
    } ${
      fieldErrors[field]
        ? "border-red-300 focus:ring-red-200 bg-red-50"
        : "border-gray-300 focus:ring-primary/20 focus:border-primary bg-white"
    }`;

  const LabelField = ({ label, name, required, children, className = "" }) => (
    <div className={`flex items-start gap-3 ${className}`}>
      <label className="text-sm text-gray-700 font-medium w-36 flex-shrink-0 pt-1.5 text-right">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}:
      </label>
      <div className="flex-1">
        {children}
        {fieldErrors[name] && <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="mb-4">
        <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          ← Back to Treaty Distribution
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isView ? "View" : isEdit ? "Edit" : "New"} Treaty Distribution
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300 mb-0">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                if (i === 0) navigate("/reinsurance/maintenance/treaty-distribution");
                if (i === 1) navigate("/reinsurance/maintenance/treaty-proportion-rules");
                if (i === 2) navigate("/reinsurance/maintenance/excess-of-loss-treaty-rules");
              }}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 transition-colors ${
                i === 0
                  ? "bg-white border-gray-300 text-gray-800 -mb-px relative z-10 font-semibold"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-200 bg-gray-50">
          <span className="text-gray-500 text-sm font-bold">⊟</span>
          <span className="text-sm font-semibold text-gray-700">
            {isView ? "View" : isEdit ? "Edit" : "New"} Risk Distribution
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-5">
            {/* Under Yr */}
            <LabelField label="Under Yr" name="underYr" required>
              <select name="underYr" value={form.underYr} onChange={handleChange} disabled={isView} className={selectCls("underYr")}>
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </LabelField>

            {/* Main Class + Sub Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabelField label="Main Class" name="mainClass" required>
                <select name="mainClass" value={form.mainClass || "General Accident"} onChange={handleChange} disabled={isView} className={selectCls("mainClass")}>
                  {MAIN_CLASS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelField>

              <LabelField label="Sub Class" name="subRiskID" required>
                <select name="subClass" value={form.subRiskID} onChange={handleChange} disabled={isView} className={selectCls("subRiskID")}>
                  {SUB_CLASS_OPTIONS.map((s) => <option key={s} value={s.substring(0, 1)}>{s}</option>)}
                </select>
              </LabelField>
            </div>

            {/* Cession Rate + Retention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabelField label="Cession Rate" name="cessionRate">
                <input type="number" name="cessionRate" value={form.cessionRate} onChange={handleChange} step="0.01" min="0" disabled={isView} className={inputCls("cessionRate")} />
              </LabelField>

              <LabelField label="Retention Capacity" name="retention">
                <input type="number" name="retentionCapacity" value={form.retention} onChange={handleChange} step="0.01" min="0" disabled={isView} className={inputCls("retention")} />
              </LabelField>
            </div>

            {/* Line Nos + 1st Surplus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <LabelField label="Line Nos" name="lineNos">
                <input type="number" name="lineNos" value={form.lineNos} onChange={handleChange} step="0.01" min="0" disabled={isView} className={inputCls("lineNos")} />
              </LabelField>

              <LabelField label="1st Surplus Value" name="surplus1">
                <input type="number" name="firstSurplusValue" value={form.surplus1} onChange={handleChange} step="0.01" min="0" disabled={isView} className={inputCls("surplus1")} />
              </LabelField>
            </div>

            {/* MPL Base Option */}
            <LabelField label="MPL Base Option" name="surplus2">
              <input type="number" name="mplBaseOption" value={form.surplus2} onChange={handleChange} step="0.01" min="0" disabled={isView} className={inputCls("surplus2")} />
            </LabelField>

            {/* Tag */}
            <LabelField label="Tag" name="tag">
              <input type="text" name="tag" value={form.tag} onChange={handleChange} disabled={isView} className={inputCls("tag")} placeholder="Optional tag" />
            </LabelField>
          </div>

          <div className="border-t border-gray-200" />

          {!isView && (
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button type="button" onClick={handleCancel} disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-8 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark">
                {loading ? "Saving..." : (isEdit ? "Update Distribution" : "Create Distribution")}
              </button>
            </div>
          )}
          
          {isView && (
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">
                Back
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewTreatyDistribution;