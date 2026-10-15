// src/components/UI/use-toast.ts  — compat shim that forwards to Sonner
import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "success" | "error" | "warning" | "destructive";

interface ToastInput {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactNode;
}

export function toast({ title, description, variant = "default", duration }: ToastInput) {
  const message = typeof title === "string" ? title : "";
  const opts: any = { description, duration };

  switch (variant) {
    case "success":     return sonnerToast.success(message, opts);
    case "error":
    case "destructive": return sonnerToast.error(message, opts);
    case "warning":     return sonnerToast.warning(message, opts);
    default:            return sonnerToast(message, opts);
  }
}

export function useToast() {
  return {
    toast,
    dismiss: (id?: string) => sonnerToast.dismiss(id),
    toasts: [],
  };
}