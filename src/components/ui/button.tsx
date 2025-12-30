import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_12px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_8px_20px_rgba(var(--primary-rgb),0.3)] border border-primary/20",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-destructive/20",
        outline: "border border-input bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/30 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary/20",
        ghost: "hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10",
        link: "text-primary underline-offset-4 hover:underline lowercase tracking-normal font-medium",
        success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm border border-success/20",
        google: "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] shadow-md border-none rounded-xl",
        social: "border border-border bg-background text-foreground hover:bg-primary/5 hover:border-primary/30 hover:text-primary",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  animateOnHover?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, animateOnHover = true, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild) {
      return (
        <motion.div
          className="inline-flex"
          whileHover={animateOnHover ? { scale: 1.02 } : undefined}
          whileTap={animateOnHover ? { scale: 0.98 } : undefined}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Slot ref={ref} className={classes} {...props} />
        </motion.div>
      );
    }

    return (
      <motion.button
        ref={ref}
        className={classes}
        whileHover={animateOnHover ? { scale: 1.02 } : undefined}
        whileTap={animateOnHover ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
