import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/class-names";
import { Link } from "react-router-dom";
import { Spinner } from "./loader";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-blue text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-primary/80 hover:text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof buttonVariants> {
  // type?: "button" | "submit" | "reset";
  asLink?: boolean;
  to?: string;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asLink = false,
      to,
      // type,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asLink ? Link : "button";
    const content = loading ? (
      <>
        <Spinner />
        <span className="sr-only">Loading</span>
      </>
    ) : (
      children
    );

    return (// @ts-ignore
      <Comp
        // type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...(asLink ? { to: to ?? "/" } : { type: // @ts-ignore
          props.type ?? "button" })}
        disabled={loading || // @ts-ignore
        props.disabled}
        ref={ref as any}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
