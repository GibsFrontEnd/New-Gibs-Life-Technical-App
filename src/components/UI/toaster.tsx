// @ts-nocheck
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"
import { useToast } from "./use-toast"
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react"

const DEFAULT_DURATION = 4000

const variants = {
  default: {
    icon: Info,
    accent: "bg-blue-500",
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
    surface: "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800",
    anim: "toast-icon-pop",
  },
  success: {
    icon: CheckCircle2,
    accent: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    surface: "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800",
    anim: "toast-icon-pop",
  },
  error: {
    icon: AlertCircle,
    accent: "bg-red-500",
    chip: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    surface: "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800",
    anim: "toast-icon-shake",
  },
  warning: {
    icon: AlertTriangle,
    accent: "bg-amber-500",
    chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    surface: "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800",
    anim: "toast-icon-pop",
  },
}
variants.destructive = variants.error

const toastStyles = `
  /* Entrance: slides in from the right with a soft spring */
  @keyframes toast-in {
    0%   { opacity: 0; transform: translateX(28px) scale(0.94); }
    60%  { opacity: 1; transform: translateX(-3px) scale(1.01); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  /* Exit: quick slide out and fade */
  @keyframes toast-out {
    0%   { opacity: 1; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(32px) scale(0.95); }
  }
  /* Icon pop */
  @keyframes toast-icon-pop {
    0%   { transform: scale(0.4) rotate(-12deg); opacity: 0; }
    65%  { transform: scale(1.18) rotate(3deg); opacity: 1; }
    100% { transform: scale(1) rotate(0); opacity: 1; }
  }
  /* Error icon: pop, then a small shake */
  @keyframes toast-icon-shake {
    0%   { transform: scale(0.4); opacity: 0; }
    40%  { transform: scale(1.12); opacity: 1; }
    55%  { transform: translateX(-3px); }
    70%  { transform: translateX(3px); }
    85%  { transform: translateX(-2px); }
    100% { transform: translateX(0) scale(1); }
  }
  /* Progress bar */
  @keyframes toast-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
  /* Accent bar grows down on entry */
  @keyframes toast-accent {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }

  .toast-root.toast-root[data-state="open"] {
    animation: toast-in 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .toast-root.toast-root[data-state="closed"] {
    animation: toast-out 220ms cubic-bezier(0.4, 0, 1, 1) forwards;
  }
  .toast-root[data-swipe="move"] {
    transform: translateX(var(--radix-toast-swipe-move-x));
    transition: none;
    animation: none;
  }
  .toast-root[data-swipe="cancel"] {
    transform: translateX(0);
    transition: transform 200ms ease-out;
  }
  .toast-root[data-swipe="end"] {
    animation: toast-out 160ms ease-out forwards;
  }

  .toast-accent   { transform-origin: top; animation: toast-accent 420ms 120ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  .toast-icon-pop { animation: toast-icon-pop 520ms 140ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .toast-icon-shake { animation: toast-icon-shake 600ms 140ms ease-out both; }
  .toast-progress {
    transform-origin: left;
    animation: toast-progress var(--toast-duration, 4000ms) linear forwards;
  }
  /* Pause the progress bar while hovering, matching Radix's timer pause */
  .toast-root:hover .toast-progress { animation-play-state: paused; }

  @media (prefers-reduced-motion: reduce) {
    .toast-root.toast-root[data-state="open"],
    .toast-root.toast-root[data-state="closed"],
    .toast-accent, .toast-icon-pop, .toast-icon-shake {
      animation-duration: 1ms !important;
      animation-delay: 0ms !important;
    }
  }
`

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={DEFAULT_DURATION}>
      <style>{toastStyles}</style>

      {toasts.map(function ({ id, title, description, action, variant = "default", duration, ...props }) {
        const v = variants[variant as keyof typeof variants] || variants.default
        const Icon = v.icon
        const ms = duration ?? DEFAULT_DURATION

        return (
          <Toast
            key={id}
            duration={ms}
            {...props}
            style={{ "--toast-duration": `${ms}ms` } as React.CSSProperties}
            className={`
              toast-root group relative pointer-events-auto overflow-hidden
              w-full max-w-[340px] rounded-lg border ${v.surface}
              py-2.5 pl-4 pr-3
              shadow-[0_4px_16px_-4px_rgba(15,23,42,0.18),0_1px_3px_rgba(15,23,42,0.08)]
              transition-shadow duration-200
              hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.24),0_2px_4px_rgba(15,23,42,0.08)]
            `}
          >
            {/* Status accent */}
            <span className={`toast-accent absolute left-0 top-0 h-full w-[3px] ${v.accent}`} />

            <div className="flex items-start gap-2.5">
              <span className={`${v.anim} mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${v.chip}`}>
                <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>

              <div className="min-w-0 flex-1 py-0.5">
                {title && (
                  <ToastTitle className="text-[13px] font-semibold leading-snug text-gray-900 dark:text-gray-50">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    {description}
                  </ToastDescription>
                )}
                {action && <div className="mt-2">{action}</div>}
              </div>

              <ToastClose
                className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" />
              </ToastClose>
            </div>

            {/* Time remaining */}
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100 dark:bg-gray-800">
              <span className={`toast-progress block h-full w-full ${v.accent} opacity-70`} />
            </span>
          </Toast>
        )
      })}

      <ToastViewport className="fixed right-4 top-20 z-[9999] flex w-full max-w-[340px] flex-col gap-2 p-0 pointer-events-none" />
    </ToastProvider>
  )
}