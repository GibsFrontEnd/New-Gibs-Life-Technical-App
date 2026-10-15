// @ts-nocheck
import { Toaster as Sonner, toast as sonnerToast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // const { theme = "system" } = useTheme()

  return (
    <Sonner
      // theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={{ top: 100, right: 40 }}
      gap={8}
      visibleToasts={3}
      duration={4000}
      closeButton
      icons={{
        success: <CheckCircle2 size={16} strokeWidth={2} />,
        error: <XCircle size={16} strokeWidth={2} />,
        warning: <AlertTriangle size={16} strokeWidth={2} />,
        info: <Info size={16} strokeWidth={2} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast relative overflow-hidden rounded-lg py-2.5 pl-4 pr-3 " +
            "group-[.toaster]:bg-background group-[.toaster]:text-foreground " +
            "group-[.toaster]:border-border group-[.toaster]:shadow-lg " +
            // left status accent bar
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-['']",
          title: "text-[13px] font-semibold leading-snug",
          description: "text-xs leading-relaxed group-[.toast]:text-muted-foreground font-bold",
          actionButton:
            "text-xs rounded-md group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "text-xs rounded-md group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-muted-foreground",
          default: "before:bg-info",
          success: "before:bg-success [&_[data-icon]]:text-success",
          error: "before:bg-destructive [&_[data-icon]]:text-destructive",
          warning: "before:bg-warning [&_[data-icon]]:text-warning",
          info: "before:bg-info [&_[data-icon]]:text-info",
        },
      }}
      {...props}
    />
  )
}

/**
 * Works with both styles:
 *   toast.success("Saved", { description: "..." })            // Sonner style
 *   toast({ title: "Saved", description: "...", variant })    // old shadcn style
 */
function toast(arg, opts) {
  if (typeof arg === "string" || typeof arg === "number") return sonnerToast(arg, opts)

  const { title, description, variant = "default", duration, action } = arg || {}
  const options = { description, duration, action }
  const message = title ?? description ?? ""

  switch (variant) {
    case "success":
      return sonnerToast.success(message, options)
    case "destructive":
    case "error":
      return sonnerToast.error(message, options)
    case "warning":
      return sonnerToast.warning(message, options)
    case "info":
      return sonnerToast.info(message, options)
    default:
      return sonnerToast(message, options)
  }
}

// keep toast.success(), toast.error(), toast.promise(), toast.dismiss(), ...
Object.assign(toast, sonnerToast)

// so `const { toast } = useToast()` keeps working in old code
function useToast() {
  return { toast, dismiss: sonnerToast.dismiss }
}

export { Toaster, toast, useToast }