"use client";

import { ChangeEvent, InputHTMLAttributes } from "react";

type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange"
> & {
  label: string;
  onChange?: (checked: boolean) => void;
};

const Checkbox = ({
  id,
  label,
  checked,
  defaultChecked,
  disabled,
  className = "",
  onChange,
  ...props
}: CheckboxProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  return (
    <div className="flex items-center">
      <input
        {...props}
        id={id}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          w-4 h-4
          border border-gray-500
          rounded
          bg-[#202c33]
          accent-wa-primary
          focus:ring-2
          focus:ring-wa-primary/30
          cursor-pointer

          disabled:cursor-not-allowed
          disabled:opacity-50

          ${className}
        `}
      />

      <label
        htmlFor={id}
        className={`
          select-none ms-2
          text-sm font-medium
          text-white

          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        `}
      >
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
