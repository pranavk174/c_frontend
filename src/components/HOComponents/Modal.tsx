"use client";
import React, { ReactNode } from "react";

const Modal = ({
  open,
  setOpen,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
}) => {
  return (
    <div
      className={`h-screen fixed inset-0 w-full z-40 flex justify-center items-center   ${open ? "visible" : "invisible"}`}
    >
      <div className="inset-0 z-10 bg-black/50 absolute"></div>

      <div
        className="absolute  transition-all duration-400 z-40"
        style={{
          transform: `translateX(-${open ? 0 : 300}%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
