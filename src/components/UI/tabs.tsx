import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../utils/class-names"
import { Badge } from "./badge"

// ==================== CONTEXT ====================

interface TabsContextType {
  activeTab?: string
  variant?: "default" | "pills" | "underline"
  size?: "sm" | "md" | "lg"
}

const TabsContext = React.createContext<TabsContextType>({})

const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  return context
}

// ==================== TABS ====================

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: "default" | "pills" | "underline"
  size?: "sm" | "md" | "lg"
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, variant = "default", size = "md", ...props }, ref) => {
  return (
    <TabsContext.Provider value={{ variant, size }}>
      <TabsPrimitive.Root
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      />
    </TabsContext.Provider>
  )
})
Tabs.displayName = TabsPrimitive.Root.displayName

// ==================== TABS LIST ====================

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  fullWidth?: boolean
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, fullWidth = true, ...props }, ref) => {
  const { variant = "default" } = useTabsContext()

  const variantStyles = {
    default: "bg-white border-b border-gray-200 rounded-none gap-2 px-2",
    pills: "bg-slate-100 p-1 rounded-xl gap-1.5",
    underline: "bg-transparent border-b border-gray-200 rounded-none gap-8 px-2",
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center relative",
        variantStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

// ==================== TABS TRIGGER ====================

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode
  badge?: string | number
  badgeColor?: "default" | "success" | "warning" | "danger" | "info"
  count?: number
  isLoading?: boolean
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ 
  className, 
  children, 
  icon, 
  badge, 
  badgeColor = "default",
  count,
  isLoading = false,
  ...props 
}, ref) => {
  const { variant = "default", size = "md" } = useTabsContext()
  const isActive = props.value === React.useContext(TabsContext)?.activeTab

  const sizeStyles = {
    sm: "text-xs py-1.5 px-3 gap-1.5",
    md: "text-sm py-2.5 px-5 gap-2",
    lg: "text-base py-3 px-7 gap-2.5",
  }

  const variantStyles = {
    default: cn(
      "relative font-medium transition-all duration-200",
      "border-b-2 border-transparent hover:border-blue-300",
      "data-[state=active]:border-[#155dfd] data-[state=active]:text-[#155dfd]",
      "hover:text-[#155dfd] hover:bg-blue-50/50",
      "rounded-t-md rounded-b-none"
    ),
    pills: cn(
      "relative font-medium rounded-md transition-all duration-200",
      "hover:bg-blue-50 hover:text-[#155dfd]",
      "data-[state=active]:bg-[#155dfd] data-[state=active]:text-white data-[state=active]:shadow-sm",
      "disabled:opacity-50 cursor-not-allowed hover:bg-transparent"
    ),
    underline: cn(
      "relative font-medium transition-all duration-200",
      "border-b-2 border-transparent",
      "data-[state=active]:border-[#155dfd] data-[state=active]:text-[#155dfd]",
      "hover:text-[#155dfd]",
      "px-0"
    ),
  }

  const badgeColors = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  }

  // Animated underline indicator
  const UnderlineIndicator = () => (
    <span 
      className={cn(
        "absolute bottom-0 left-0 h-0.5 bg-[#155dfd] transition-all duration-300 ease-in-out",
        isActive ? "w-full" : "w-0"
      )}
    />
  )

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <svg 
          className="animate-spin h-4 w-4 flex-shrink-0" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {/* Icon */}
      {icon && !isLoading && (
        <span className={cn(
          "flex-shrink-0 transition-transform duration-200",
          isActive && "scale-110"
        )}>
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="relative">
        {children}
        {variant === "underline" && <UnderlineIndicator />}
      </span>

      {/* Count Badge */}
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}

      {/* Badge */}
      {badge !== undefined && (
        <Badge 
          variant="outline"
          className={cn(
            "px-2 py-0 text-[10px] font-medium rounded-full",
            badgeColors[badgeColor],
            isActive && "ring-2 ring-blue-200 ring-offset-2"
          )}
        >
          {badge}
        </Badge>
      )}

      {/* Active pill indicator */}
      {variant === "pills" && isActive && (
        <span className="absolute inset-0 rounded-md bg-[#155dfd] -z-10 animate-in fade-in zoom-in-95 duration-200" />
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// ==================== TABS CONTENT ====================

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  animate?: boolean
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, children, animate = true, ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155dfd] focus-visible:ring-offset-2",
        animate && "animate-in slide-in-from-top-3 fade-in duration-300",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }