import React, { Dispatch, ReactNode, SetStateAction } from "react";

interface PopupProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}

const Popups = ({ children, open, setOpen }: PopupProps) => {
  return (
    <div
      className={`bg-red-400 relative    ${open ? "visible" : "invisible"} `}
    >
      <div className="absolute right-3   z-40">{children}</div>
    </div>
  );
};

export default Popups;
