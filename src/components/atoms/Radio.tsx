"use client";

import { useState, useEffect, forwardRef, ReactNode } from "react";

interface RadioProps {
  label?: string;
  customLabel?: ReactNode;
  value?: boolean;
  name: string;
  onChange?: (selected: boolean) => void;
  state?: "correct" | "incorrect";
}

const Radio = forwardRef<HTMLLabelElement, RadioProps>(
  ({ label, customLabel, value, name, onChange, state }, ref) => {
    const [internalChecked, setInternalChecked] = useState(false);

    const isControlled = value !== undefined;

    const handleSelect = () => {
      if (!isControlled) {
        setInternalChecked(true);
      }
      onChange?.(true);
    };

    useEffect(() => {
      if (isControlled) {
        setInternalChecked(value);
      }
    }, [value, isControlled]);

    const isChecked = isControlled ? value : internalChecked;

    const showDot = state === "correct" || state === "incorrect" || isChecked;

    const borderColor =
      state === "correct"
        ? "border-green-500"
        : state === "incorrect"
          ? "border-red-500"
          : isChecked
            ? "border-[#007FFF]"
            : "border-[#D6D6D6]";

    const dotColor =
      state === "correct"
        ? "bg-green-500"
        : state === "incorrect"
          ? "bg-red-500"
          : "bg-[#39F]";

    return (
      <label ref={ref} className="flex w-fit cursor-pointer items-center">
        <input
          type="radio"
          name={name}
          checked={isChecked}
          onChange={handleSelect}
          className="sr-only"
        />
        <div
          className={`flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-full border-[1.5px] bg-white transition-colors duration-[.4s] ${borderColor}`}
        >
          {showDot && (
            <span
              className={`aspect-square h-[.625rem] w-[.625rem] rounded-[50%] ${dotColor}`}
            />
          )}
        </div>
        {customLabel ? (
          customLabel
        ) : label ? (
          <span className="ml-2 text-[0.875rem] font-[400] text-black">
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Radio.displayName = "Radio";

export { Radio };
