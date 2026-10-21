// @ts-nocheck
// Splits the individual policy setup forms into steps. Each step checks its own required fields
// before moving on; the form's own validateForm still runs on save. If a field on an earlier step
// is missing at save time, the form goes back to that step instead of only showing a toast.
import { useRef, useState } from "react";

export const POLICY_STEPS = ["Client", "Identity & health", "Plan", "Payment & save"];

/** [field, label, rule?] where rule "positive" means a number greater than 0. */
export type StepField = [string, string, "positive"?];

const isBlank = (v: any) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

const firstProblem = (formData: any, fields: StepField[]): string | null => {
  for (const [field, label, rule] of fields) {
    const v = formData[field];
    if (rule === "positive") {
      if (!(Number(v) > 0)) return `${label} must be greater than 0`;
    } else if (isBlank(v)) {
      return `${label} is required`;
    }
  }
  return null;
};

export const usePolicySteps = ({
  formData,
  stepFields,
  toast,
  editMode,
  onSave,
}: {
  formData: any;
  stepFields: StepField[][];
  toast: (t: any) => void;
  editMode: boolean;
  onSave: (e: any) => void;
}) => {
  const last = POLICY_STEPS.length - 1;
  const [step, setStep] = useState(0);
  // An existing policy can jump to any step; a new one only to steps it has reached.
  const [reached, setReached] = useState(editMode ? last : 0);
  const topRef = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    setStep(i);
    setReached((r) => Math.max(r, i));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const checkStep = (i: number) => {
    const problem = firstProblem(formData, stepFields[i] ?? []);
    if (problem) {
      toast({ title: "Validation Error", description: problem, variant: "destructive" });
      return false;
    }
    return true;
  };

  /** Check every step (going back to the first one with a gap), then save. */
  const saveAll = (e: any) => {
    e?.preventDefault?.();
    for (let i = 0; i <= last; i++) {
      if (!checkStep(i)) {
        if (i !== step) goTo(i);
        return;
      }
    }
    onSave(e);
  };

  /** The form's submit: Continue on every step but the last, Save on the last. */
  const onSubmit = (e: any) => {
    e.preventDefault();
    if (step < last) {
      if (checkStep(step)) goTo(step + 1);
      return;
    }
    saveAll(e);
  };

  const back = () => goTo(Math.max(0, step - 1));

  return { step, reached, goTo, onSubmit, saveAll, back, isLast: step === last, isFirst: step === 0, topRef, steps: POLICY_STEPS };
};
