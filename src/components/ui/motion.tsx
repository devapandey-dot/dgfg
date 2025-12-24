import { motion, AnimatePresence, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export const PageTransition = ({ children, className, ...props }: React.PropsWithChildren<{ className?: string } & HTMLMotionProps<"div">>) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("will-change-transform", className)}
      {...props}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export const MotionCard = ({ children, className, ...props }: React.PropsWithChildren<{ className?: string } & HTMLMotionProps<"div">>) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
    whileTap={{ scale: 0.99 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={cn("bg-card rounded-xl border border-border shadow-card", className)}
    {...props}
  >
    {children}
  </motion.div>
);

// Fade-and-lift on scroll, respecting reduced-motion
export const FadeInOnScroll = ({ children, className, ...props }: React.PropsWithChildren<{ className?: string } & HTMLMotionProps<"div">>) => {
  const prefersReducedMotion = useReducedMotion();
  const initial = prefersReducedMotion ? {} : { opacity: 0, y: 12 };
  const animate = prefersReducedMotion ? {} : { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Lightweight presence wrapper for list updates to avoid jank
export const ListPresence = ({ children }: React.PropsWithChildren) => (
  <AnimatePresence initial={false} mode="popLayout">
    {children}
  </AnimatePresence>
);