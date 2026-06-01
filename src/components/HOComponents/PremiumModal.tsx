"use client";

import { valueProps } from "@/lib/dummy";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import React, { ReactNode, useEffect } from "react";

interface PremiumModalProps {
  // open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnOutsideClick?: boolean;
  values: valueProps;
}

const backdropVariants = {
  hidden: {
    opacity: 0,
    backdropFilter: "blur(0px)",
  },
  visible: {
    opacity: 1,
    backdropFilter: "blur(10px)",
    transition: {
      duration: 0.25,
    },
  },
};

const backdropVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 40,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 18,
      stiffness: 180,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const modalVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

const PremiumModal = ({
  // open,
  onClose,
  children,

  values = {
    type: null,
    open: false,
  },
  className = "",
  closeOnOutsideClick = true,
}: PremiumModalProps) => {
  const shouldReduceMotion = useReducedMotion();
  useEffect(() => {
    if (values.open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [values.open]);

  return (
    <AnimatePresence>
      {values.open && (
        <motion.div
          variants={
            shouldReduceMotion ? backdropVariantsReduced : backdropVariants
          }
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={() => {
            if (closeOnOutsideClick) {
              onClose();
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        >
          <motion.div
            variants={shouldReduceMotion ? modalVariantsReduced : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={`
              relative
              w-full
              max-w-lg
              overflow-hidden
              rounded-3xl
              border
              border-white/10
              bg-white/10
              shadow-[0_8px_40px_rgba(0,0,0,0.35)]
              backdrop-blur-2xl
              dark:bg-[#111]/80
              ${className}
            `}
          >
            {/* Glow Effects */}
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

            {/* Content */}
            <div className="relative z-10">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PremiumModal;
