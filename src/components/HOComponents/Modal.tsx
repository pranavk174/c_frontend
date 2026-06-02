"use client";
import React, { ReactNode, SetStateAction } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { valueProps } from "@/lib/dummy";

const Modal = ({
  // open,
  // setOpen,
  setModal,
  children,
  values = {
    type: null,
    open: false,
  },
}: {
  // open: boolean;
  values: valueProps;
  setModal: React.Dispatch<SetStateAction<valueProps>>;
  // setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
}) => {

  return (
    <AnimatePresence>
      {values.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() =>
              setModal({
                type: null,
                open: false,
              })
            }
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ x: "-300%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-300%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="z-50 relative w-full flex justify-center"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
