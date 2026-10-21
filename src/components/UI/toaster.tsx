// @ts-nocheck
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast"
import { useToast } from "./use-toast"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

const ToastIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  destructive: AlertCircle,
}

const ToastColors = {
  default: "bg-white border-gray-200/80",
  success: "bg-emerald-50 border-emerald-200",
  error: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  destructive: "bg-red-50 border-red-200",
}

const IconColors = {
  default: "text-blue-500",
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  destructive: "text-red-500",
}

const TextColors = {
  default: "text-gray-900",
  success: "text-emerald-900",
  error: "text-red-900",
  warning: "text-amber-900",
  destructive: "text-red-900",
}

const DescriptionColors = {
  default: "text-gray-600",
  success: "text-emerald-700",
  error: "text-red-700",
  warning: "text-amber-700",
  destructive: "text-red-700",
}

const AccentColors = {
  default: "from-blue-400 to-blue-600",
  success: "from-emerald-400 to-emerald-600",
  error: "from-red-400 to-red-600",
  warning: "from-amber-400 to-amber-600",
  destructive: "from-red-400 to-red-600",
}

const ProgressColors = {
  default: "bg-blue-500",
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  destructive: "bg-red-500",
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={4000}>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        const Icon = ToastIcons[variant as keyof typeof ToastIcons] || ToastIcons.default
        const iconColor = IconColors[variant as keyof typeof IconColors] || IconColors.default
        const toastColor = ToastColors[variant as keyof typeof ToastColors] || ToastColors.default
        const textColor = TextColors[variant as keyof typeof TextColors] || TextColors.default
        const descriptionColor = DescriptionColors[variant as keyof typeof DescriptionColors] || DescriptionColors.default
        const accentColor = AccentColors[variant as keyof typeof AccentColors] || AccentColors.default
        const progressColor = ProgressColors[variant as keyof typeof ProgressColors] || ProgressColors.default

        return (
          <Toast 
            key={id} 
            {...props} 
            className={`
              group
              relative w-full max-w-sm rounded-xl
              ${toastColor}
              shadow-lg
              border
              transition-all duration-300 ease-out
              hover:shadow-xl hover:scale-[1.02]
              data-[state=open]:animate-in data-[state=closed]:animate-out
              data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full
              data-[state=open]:sm:slide-in-from-bottom-full
              py-3.5 px-4
              pointer-events-auto
              overflow-hidden
            `}
          >
            {/* Gradient accent bar */}
            <div className={`
              absolute top-0 left-0 w-1.5 h-full
              bg-gradient-to-b ${accentColor}
            `} />

            <div className="flex items-start gap-3 pl-2">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                {title && (
                  <ToastTitle className={`text-sm font-semibold ${textColor} leading-tight`}>
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className={`text-sm ${descriptionColor} mt-0.5 leading-relaxed`}>
                    {description}
                  </ToastDescription>
                )}
                {action && (
                  <div className="mt-2">
                    {action}
                  </div>
                )}
              </div>
              
              <ToastClose className={`flex-shrink-0 rounded-full p-1.5 ${textColor} hover:bg-black/5 transition-colors opacity-60 hover:opacity-100`}>
                <X className="h-4 w-4" />
              </ToastClose>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
              <div className={`
                h-full transition-all duration-[4000ms] ease-linear
                ${progressColor}
                animate-[shrink_4s_linear_forwards]
              `} />
            </div>
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-20 right-4 flex flex-col gap-3 w-full max-w-sm p-4 z-[9999] pointer-events-none" />
    </ToastProvider>
  )
}