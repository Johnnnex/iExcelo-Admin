"use client";

import { useState, useEffect, forwardRef, ReactNode } from "react";
import { Icon } from "@iconify/react";

interface CheckBoxProps {
  label?: string;
  customLabel?: ReactNode;
  value?: boolean;
  isRequired?: boolean;
  onChange?: (checked: boolean) => void;
  state?: "correct" | "incorrect";
}

const CheckBox = forwardRef<HTMLLabelElement, CheckBoxProps>(
  ({ label, customLabel, value, isRequired = false, onChange, state }, ref) => {
    const [internalChecked, setInternalChecked] = useState(false);

    const isControlled = value !== undefined;

    const handleToggle = () => {
      if (!isControlled) {
        setInternalChecked((prev) => !prev);
      }
      if (onChange) {
        onChange(isControlled ? !value : !internalChecked);
      }
    };

    useEffect(() => {
      if (isControlled) {
        setInternalChecked(value);
      }
    }, [value, isControlled]);

    const isChecked = isControlled ? value : internalChecked;

    const showIcon = state === "correct" || state === "incorrect" || isChecked;

    const borderAndTextColor =
      state === "correct"
        ? "border-green-500 text-green-500"
        : state === "incorrect"
          ? "border-red-500 text-red-500"
          : isChecked
            ? "border-[#007fff] text-[#007fff]"
            : "border-[#D0D5DD] text-[#D0D5DD]";

    const iconName = state === "incorrect" ? "lucide:x" : "lucide:check";

    return (
      <label ref={ref} className="relative flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={isChecked}
          required={isRequired}
          onChange={handleToggle}
          className="sr-only"
        />
        <div
          className={`shrink-0 flex h-[1.25rem] w-[1.25rem] items-center justify-center rounded-md border bg-white transition-colors duration-200 ${borderAndTextColor}`}
        >
          {showIcon && (
            <Icon
              icon={iconName}
              width=".875rem"
              height=".875rem"
              color="inherit"
            />
          )}
        </div>
        {customLabel ? (
          customLabel
        ) : (
          <span className="ml-2 text-[0.875rem] font-[400] text-black">
            {label}
          </span>
        )}
      </label>
    );
  },
);

CheckBox.displayName = "Checkbox";

export { CheckBox };
