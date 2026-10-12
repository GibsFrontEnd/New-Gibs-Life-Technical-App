// pages/ExcessOfLossTreatyRulesForm.tsx
//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../features/store";
import {
  createTreatyExcessLoss,
  updateTreatyExcessLoss,
  fetchTreatyExcessLossById,
  clearSelectedRecord,
} from "../../features/reducers/reinsuranceReducers/treatyExcessLossSlice";
import { CreateTreatyExcessLossDto, TreatyExcessLossDto } from "../../types/treatyExcessLoss";

// Toast component
const Toast = ({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed top-20 right-4 z-50">
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

const TABS = [
  { label: "Treaty Distribution", path: "/reinsurance/maintenance/treaty-distribution" },
  { label: "Treaty Proportion Rules", path: "/reinsurance/maintenance/treaty-proportion-rules" },
  { label: "Excess of Loss Treaty Rules", path: "/reinsurance/maintenance/excess-of-loss-treaty-rules" },
  { label: "Fac-Out Auto Distribution Rules", path: "" },
];

const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => String(2026 - i));
const MAIN_CLASS_OPTIONS = [
  "Bond", "Engineering", "General Accident", "Fire & Special Perils",
  "Marine", "Motor", "Aviation", "Oil & Gas", "Life", "Health",
];
const REINSTATEMENT_OPTIONS = ["Once", "Twice", "Three Times", "Unlimited"];

const initialForm: CreateTreatyExcessLossDto = {
  subriskID: "",
  partyID: "",
  underYr: 2026,
  cover: 0,
  deductible: 0,
  mdPremium: 0,
  _2ndCover: 0,
  _2ndDeductible: 0,
  _2ndMDPremium: 0,
  reinstateNo: 1, // Default to 1 (Once)
  reinstatePercent: 100,
  adjustRate1: 0,
  adjustRate2: 0,
  adjust2ndRate1: 0,
  adjust2ndRate2: 0,
  loadingFactor: 0,
  a1: 0,
  a2: 0,
  tag: "",
};

const ExcessOfLossTreatyRulesForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { subriskId, underYr } = useParams<{ subriskId: string; underYr: string }>();
  const { selectedRecord, loading, error } = useSelector((state: RootState) => state.treatyExcessLoss);
  
  const isEdit = !!subriskId && !!underYr;
  const isView = window.location.pathname.includes("/view/");
  
  const [form, setForm] = useState<CreateTreatyExcessLossDto>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateTreatyExcessLossDto, string>>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && subriskId && underYr) {
      dispatch(fetchTreatyExcessLossById({ subriskId, underYr: parseInt(underYr) }));
    }
    return () => {
      dispatch(clearSelectedRecord());
    };
  }, [dispatch, isEdit, subriskId, underYr]);

  useEffect(() => {
    if (selectedRecord && isEdit) {
      setForm(selectedRecord);
    }
  }, [selectedRecord, isEdit]);

  useEffect(() => {
    if (error) {
      setToast({ type: "error", message: error });
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Fix: For number inputs, don't convert empty string to 0
    let parsedValue: any = value;
    if (type === "number") {
      parsedValue = value === "" ? 0 : Number(value);
    }
    setForm(prev => ({ ...prev, [name]: parsedValue }));
    if (fieldErrors[name as keyof CreateTreatyExcessLossDto]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateTreatyExcessLossDto, string>> = {};
    if (!form.subriskID) errors.subriskID = "Subrisk ID is required";
    if (!form.partyID) errors.partyID = "Party ID is required";
    if (!form.underYr) errors.underYr = "Under Year is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Get current user from localStorage or your auth store
      const currentUser = localStorage.getItem('username') || "system";
      
      const submitData = {
        ...form,
        submitBy: currentUser,
        modifiedBy: currentUser
      };
      
      if (isEdit) {
        await dispatch(updateTreatyExcessLoss(submitData as TreatyExcessLossDto)).unwrap();
        setToast({ type: "success", message: "Record updated successfully!" });
        setTimeout(() => navigate("/reinsurance/maintenance/excess-of-loss-treaty-rules"), 1500);
      } else {
        await dispatch(createTreatyExcessLoss(submitData)).unwrap();
        setToast({ type: "success", message: "Record created successfully!" });
        // Reset form after successful creation
        setForm(initialForm);
        setTimeout(() => navigate("/reinsurance/maintenance/excess-of-loss-treaty-rules"), 1500);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setToast({ type: "error", message: err.message || err || "An error occurred" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate("/reinsurance/maintenance/excess-of-loss-treaty-rules");

  const inputCls = (field: keyof CreateTreatyExcessLossDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      isView ? "bg-gray-50 cursor-not-allowed" : "bg-white hover:border-gray-400"
    } ${
      fieldErrors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-primary/20 focus:border-primary"
    }`;

  const selectCls = (field: keyof CreateTreatyExcessLossDto) =>
    `w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 transition-colors ${
      isView ? "bg-gray-50 cursor-not-allowed" : "bg-white hover:border-gray-400"
    } ${
      fieldErrors[field] ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:ring-primary/20 focus:border-primary"
    }`;

  const LabelField = ({ label, name, children, labelWidth = "w-52" }: {
    label: string; name: keyof CreateTreatyExcessLossDto; required?: boolean; children: React.ReactNode; labelWidth?: string;
  }) => (
    <div className="flex items-start gap-3">
      <label className={`text-sm text-gray-700 font-medium ${labelWidth} flex-shrink-0 pt-1.5`}>{label}:</label>
      <div className="flex-1 min-w-0">
        {children}
        {fieldErrors[name] && <p className="text-xs text-red-500 mt-0.5">{fieldErrors[name]}</p>}
      </div>
    </div>
  );

  const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-gray-500 text-sm font-bold">⊟</span>
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  if (loading && isEdit) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {isView ? "View" : isEdit ? "Edit" : "Create"} Treaty Excess Of Loss Rules
        </h1>
      </div>

      <div className="border-b border-gray-300">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => tab.path && navigate(tab.path)}
              className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-t-md mr-1 transition-colors ${
                i === 2
                  ? "bg-white border-gray-300 text-gray-800 -mb-px relative z-10 font-semibold"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-sm">
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-200 bg-gray-50">
          <span className="text-gray-500 text-sm font-bold">⊟</span>
          <span className="text-sm font-semibold text-gray-700">
            {isView ? "View" : isEdit ? "Edit" : "New"} Excess Of Loss Treaty Rules
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-6">
            {/* Under Yr + Main Class */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <LabelField label="Under Yr" name="underYr">
                <select name="underYr" value={form.underYr} onChange={handleChange} disabled={isView} className={selectCls("underYr")}>
                  {YEAR_OPTIONS.map(y => <option key={y} value={parseInt(y)}>{y}</option>)}
                </select>
              </LabelField>
              <div />
              <LabelField label="Main Class" name="tag">
                <select name="tag" value={form.tag} onChange={handleChange} disabled={isView} className={selectCls("tag")}>
                  <option value="">Select Main Class</option>
                  {MAIN_CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </LabelField>
              <div />
            </div>

            {/* First Layer Covers & Deductibles */}
            <SubSection title="First Layer Covers & Deductibles">
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                <LabelField label="Treaty Cover" name="cover">
                  <input type="number" name="cover" value={form.cover || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("cover")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="Deductible" name="deductible">
                  <input type="number" name="deductible" value={form.deductible || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("deductible")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="Minimum Deposit Premium" name="mdPremium">
                  <input type="number" name="mdPremium" value={form.mdPremium || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("mdPremium")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="Adjustable Rate (Min)" name="adjustRate1">
                  <input type="number" name="adjustRate1" value={form.adjustRate1 || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("adjustRate1")} placeholder="Enter rate" />
                </LabelField>
                <LabelField label="Adjustable Rate (Max)" name="adjustRate2">
                  <input type="number" name="adjustRate2" value={form.adjustRate2 || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("adjustRate2")} placeholder="Enter rate" />
                </LabelField>
                <LabelField label="Loading Factor (Burning)" name="loadingFactor">
                  <input type="number" name="loadingFactor" value={form.loadingFactor || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("loadingFactor")} placeholder="Enter factor" />
                </LabelField>
                <LabelField label="Reinstatement Count" name="reinstateNo">
                  <select name="reinstateNo" value={form.reinstateNo} onChange={handleChange} disabled={isView} className={selectCls("reinstateNo")}>
                    <option value={1}>Once</option>
                    <option value={2}>Twice</option>
                    <option value={3}>Three Times</option>
                    <option value={4}>Unlimited</option>
                  </select>
                </LabelField>
                <LabelField label="At What Percentage(%)" name="reinstatePercent">
                  <input type="number" name="reinstatePercent" value={form.reinstatePercent || ''} onChange={handleChange} step="1" min="0" max="100" disabled={isView} className={inputCls("reinstatePercent")} placeholder="Enter percentage" />
                </LabelField>
              </div>
            </SubSection>

            {/* Second Layer Covers & Deductibles */}
            <SubSection title="Second Layer Covers & Deductibles">
              <div className="grid grid-cols-2 gap-x-10 gap-y-4">
                <LabelField label="2nd Layer Treaty Cover" name="_2ndCover">
                  <input type="number" name="_2ndCover" value={form._2ndCover || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("_2ndCover")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="2nd Layer Deductible" name="_2ndDeductible">
                  <input type="number" name="_2ndDeductible" value={form._2ndDeductible || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("_2ndDeductible")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="2nd Layer MD Premium" name="_2ndMDPremium">
                  <input type="number" name="_2ndMDPremium" value={form._2ndMDPremium || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("_2ndMDPremium")} placeholder="Enter amount" />
                </LabelField>
                <LabelField label="Adjustable Rate (Min)" name="adjust2ndRate1">
                  <input type="number" name="adjust2ndRate1" value={form.adjust2ndRate1 || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("adjust2ndRate1")} placeholder="Enter rate" />
                </LabelField>
                <LabelField label="Adjustable Rate (Max)" name="adjust2ndRate2">
                  <input type="number" name="adjust2ndRate2" value={form.adjust2ndRate2 || ''} onChange={handleChange} step="any" disabled={isView} className={inputCls("adjust2ndRate2")} placeholder="Enter rate" />
                </LabelField>
              </div>
            </SubSection>
          </div>

          <div className="border-t border-gray-200" />

          {!isView && (
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button type="button" onClick={handleCancel} disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-8 py-2 text-sm font-medium text-white bg-primary rounded hover:bg-primary-dark transition-colors disabled:opacity-70">
                {submitting ? (
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Submit</>
                )}
              </button>
            </div>
          )}
          
          {isView && (
            <div className="flex items-center justify-center gap-4 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                Back
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ExcessOfLossTreatyRulesForm;