"use client";

import { useState, useEffect, forwardRef, memo, useRef } from "react";
import { InputFieldProps } from "./InputField";
import { TimePicker } from "./TimePicker";
import { Icon } from "@iconify/react";

const generateDaysInMonth = (year: number, month: number) => {
  const days: Date[] = [];
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const leadingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const prevMonthLastDate = new Date(year, month, 0).getDate();

  for (let i = leadingDays; i > 0; i--) {
    days.push(new Date(year, month - 1, prevMonthLastDate - i + 1));
  }

  for (let i = 1; i <= totalDaysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const trailingDays = 7 - (days.length % 7);
  if (trailingDays < 7) {
    for (let i = 1; i <= trailingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
  }

  return days;
};

const CustomDateTimePicker = memo(
  forwardRef<any, InputFieldProps>(
    (
      {
        name = "input",
        error,
        placeholder = "Select Date & Time",
        value,
        disabled,
        ...rest
      },
      ref,
    ) => {
      const [finalDate, setFinalDate] = useState<Date | null>(null);
      const [isOpen, setIsOpen] = useState(false);

      const [pendingDate, setPendingDate] = useState(new Date());
      const [pendingSelectedTime, setPendingSelectedTime] = useState({
        hour: 12,
        minute: 0,
        second: 0,
        isAM: true,
      });

      const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
      const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

      const initialYear = new Date().getFullYear();
      const minYear = initialYear - 50;
      const maxYear = initialYear + 10;

      const containerRef = useRef<HTMLDivElement>(null);
      const yearDropDowncontainerRef = useRef<HTMLDivElement>(null);
      const monthDropDowncontainerRef = useRef<HTMLDivElement>(null);

      const daysInMonth = generateDaysInMonth(
        pendingDate.getFullYear(),
        pendingDate.getMonth(),
      );

      const changeMonth = (offset: number) => {
        setPendingDate((prev) => {
          const targetMonth = prev.getMonth() + offset;
          const candidate = new Date(
            prev.getFullYear(),
            targetMonth,
            prev.getDate(),
          );
          if (candidate.getMonth() !== ((targetMonth % 12) + 12) % 12) {
            return new Date(prev.getFullYear(), targetMonth, 1);
          }
          return candidate;
        });
      };

      const changeYear = (offset: number) => {
        setPendingDate((prev) => {
          const newYear = prev.getFullYear() + offset;
          const candidate = new Date(newYear, prev.getMonth(), prev.getDate());
          if (candidate.getMonth() !== prev.getMonth()) {
            return new Date(newYear, prev.getMonth(), 1);
          }
          return candidate;
        });
      };

      const getFormattedDate = () => {
        return finalDate ? finalDate.toUTCString() : "";
      };

      const monthNames = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString("default", { month: "long" }),
      );
      const years = Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => minYear + i,
      );

      useEffect(() => {
        if (isOpen) {
          const baseDate = finalDate ? new Date(finalDate) : new Date();
          setPendingDate(baseDate);
          let hours = baseDate.getHours();
          const isAM = hours < 12;
          if (hours === 0) hours = 12;
          if (hours > 12) hours -= 12;
          setPendingSelectedTime({
            hour: hours,
            minute: baseDate.getMinutes(),
            second: baseDate.getSeconds(),
            isAM,
          });
        }
      }, [isOpen, finalDate]);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            isOpen &&
            containerRef.current &&
            !containerRef.current.contains(event.target as Node)
          ) {
            setIsOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isOpen]);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            isYearDropdownOpen &&
            yearDropDowncontainerRef.current &&
            !yearDropDowncontainerRef.current.contains(event.target as Node)
          ) {
            setIsYearDropdownOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isYearDropdownOpen]);

      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            isMonthDropdownOpen &&
            monthDropDowncontainerRef.current &&
            !monthDropDowncontainerRef.current.contains(event.target as Node)
          ) {
            setIsMonthDropdownOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }, [isMonthDropdownOpen]);

      useEffect(() => {
        if (!!value) {
          setFinalDate(new Date((value as number) * 1000));
        }
      }, [value]);

      return (
        <div ref={containerRef}>
          <input
            type="text"
            readOnly
            name={name}
            ref={ref}
            placeholder={placeholder}
            disabled={disabled}
            value={getFormattedDate()}
            onClick={() => setIsOpen((prev) => !prev)}
            className={`border outline-none ${
              !!error
                ? "border-[#FDA29B] text-[#F04438]"
                : "border-[#D0D5DD] text-[#667085]"
            } relative h-[2.75rem] w-full cursor-pointer rounded-[0.5rem] bg-white p-[0.625rem_0.875rem] text-[1rem] font-[400] leading-[1.5rem] caret-transparent placeholder:font-[300] placeholder:opacity-[.7]`}
            {...rest}
          />
          <Icon
            icon={!!error ? "hugeicons:information-circle" : "hugeicons:calendar-01"}
            color={!!error ? "#F04438" : "#667085"}
            style={{
              position: "absolute",
              inset: "0.875rem 0.825rem 0.875rem auto",
            }}
          />
          {isOpen && (
            <div
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow:
                  "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
              }}
              className="absolute z-[1] min-w-[41rem] rounded-[.5rem] border border-[#EAECF0] bg-white"
            >
              <div className="flex">
                <div className="flex flex-1 flex-col gap-[.75rem] border-r border-[#EAECF0] p-[1.25rem_1.5rem]">
                  <h4 className="py-[.625rem] text-[1.02rem] font-[600] text-[#344054]">
                    Set Date
                  </h4>
                  <div className="flex items-center justify-between">
                    {/* Month */}
                    <div
                      ref={monthDropDowncontainerRef}
                      className="relative flex items-center gap-[.25rem]"
                    >
                      <button
                        type="button"
                        className="cursor-pointer p-[.5rem]"
                        onClick={() => changeMonth(-1)}
                      >
                        <Icon icon="hugeicons:arrow-left-01" color="#49454F" />
                      </button>
                      <div
                        className="flex cursor-pointer items-center gap-[.5rem] p-[.25rem] text-[.875rem] font-[500] leading-[1.25rem]"
                        onClick={() => {
                          setIsMonthDropdownOpen(!isMonthDropdownOpen);
                        }}
                      >
                        {monthNames[pendingDate.getMonth()].substring(0, 3)}
                        <Icon icon="hugeicons:arrow-down-01" color="#49454F" />
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer p-[.5rem]"
                        onClick={() => changeMonth(1)}
                      >
                        <Icon icon="hugeicons:arrow-right-01" color="#49454F" />
                      </button>

                      {isMonthDropdownOpen && (
                        <div
                          style={{
                            left: "50%",
                            transform: "translateX(-50%)",
                            boxShadow:
                              "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                          }}
                          className="absolute top-[100%] max-h-[21.375rem] w-[9.25rem] overflow-y-auto rounded-[.5rem] border border-[#EAECF0] bg-white p-[.625rem_0.375rem]"
                        >
                          {monthNames.map((name, index) => (
                            <button
                              key={`__month__dropdown__${name}__${index}`}
                              className={`flex w-full items-center justify-between rounded-[.375rem] p-[.625rem] text-[.75rem] font-[500] leading-[1.25rem] text-[#344054] transition-all duration-[.4s] ${
                                index === pendingDate.getMonth()
                                  ? "bg-[#F9FAFB] text-[#101828]"
                                  : "text-[#344054] hover:bg-[#F9FAFBaa]"
                              }`}
                              onClick={() => {
                                setPendingDate((prev) => {
                                  const candidate = new Date(
                                    prev.getFullYear(),
                                    index,
                                    prev.getDate(),
                                  );
                                  return candidate.getMonth() === index
                                    ? candidate
                                    : new Date(prev.getFullYear(), index, 1);
                                });
                                setIsMonthDropdownOpen(false);
                              }}
                            >
                              {name}{" "}
                              {index === pendingDate.getMonth() && (
                                <Icon icon="hugeicons:tick-01" color="#FF6642" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Year */}
                    <div
                      ref={yearDropDowncontainerRef}
                      className="relative flex items-center gap-[.25rem]"
                    >
                      <button
                        type="button"
                        className="cursor-pointer p-[.5rem] text-[#49454F] disabled:cursor-not-allowed disabled:text-[#49454F90]"
                        onClick={() => changeYear(-1)}
                        disabled={pendingDate.getFullYear() <= minYear}
                      >
                        <Icon icon="hugeicons:arrow-left-01" />
                      </button>
                      <div
                        className="flex cursor-pointer items-center gap-[.5rem] p-[.25rem] text-[.875rem] font-[500] leading-[1.25rem]"
                        onClick={() => {
                          setIsYearDropdownOpen(!isYearDropdownOpen);
                        }}
                      >
                        {pendingDate.getFullYear()}
                        <Icon icon="hugeicons:arrow-down-01" color="#49454F" />
                      </div>
                      <button
                        type="button"
                        className="cursor-pointer p-[.5rem] text-[#49454F] disabled:cursor-not-allowed disabled:text-[#49454F90]"
                        onClick={() => changeYear(1)}
                        disabled={pendingDate.getFullYear() >= maxYear}
                      >
                        <Icon icon="hugeicons:arrow-right-01" />
                      </button>

                      {isYearDropdownOpen && (
                        <div
                          style={{
                            left: "50%",
                            transform: "translateX(-50%)",
                            boxShadow:
                              "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                          }}
                          className="absolute top-[100%] max-h-[21.375rem] w-[9.25rem] overflow-y-auto rounded-[.5rem] border border-[#EAECF0] bg-white p-[.625rem_0.375rem]"
                        >
                          {years.map((year, index) => (
                            <button
                              key={`__year__dropdown__${year}__${index}`}
                              className={`flex w-full items-center justify-between rounded-[.375rem] p-[.625rem] text-[.75rem] font-[500] leading-[1.25rem] text-[#344054] transition-all duration-[.4s] ${
                                year === pendingDate.getFullYear()
                                  ? "bg-[#F9FAFB] text-[#101828]"
                                  : "text-[#344054] hover:bg-[#F9FAFBaa]"
                              }`}
                              onClick={() => {
                                setPendingDate((prev) => {
                                  const candidate = new Date(
                                    year,
                                    prev.getMonth(),
                                    prev.getDate(),
                                  );
                                  return candidate.getMonth() ===
                                    prev.getMonth()
                                    ? candidate
                                    : new Date(year, prev.getMonth(), 1);
                                });
                                setIsYearDropdownOpen(false);
                              }}
                            >
                              {year}
                              {year === pendingDate.getFullYear() && (
                                <Icon icon="hugeicons:tick-01" color="#FF6642" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    }}
                    className="rounded-[.5rem] border border-[#D0D5DD] p-[.5rem_.875rem] text-[1rem] font-[400] leading-[1.5rem] text-[#101828]"
                  >
                    {pendingDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>

                  <div className="grid w-full grid-cols-7 gap-y-[.25rem]">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"].map(
                      (day, index) => (
                        <span
                          className="flex aspect-square items-center justify-center p-[.625rem_.5rem] text-[.875rem] font-[500] leading-[1.25rem] text-[#344054]"
                          key={`__${day}__${index}`}
                        >
                          {day}
                        </span>
                      ),
                    )}
                    {daysInMonth.map((day, index) => (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDate(day);
                        }}
                        key={`__this__date__${day.getDate()}__${index}`}
                        className={`flex aspect-square items-center justify-center p-[.625rem_.5rem] text-[.875rem] font-[400] leading-[1.25rem] text-[#344054] ${
                          pendingDate.getDate() === day.getDate() &&
                          pendingDate.getMonth() === day.getMonth() &&
                          pendingDate.getFullYear() === day.getFullYear()
                            ? "rounded-[50%] border border-[#FF6642]"
                            : ""
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    ))}
                  </div>
                </div>

                <TimePicker
                  pendingSelectedTime={pendingSelectedTime}
                  onChange={(pendingTime) =>
                    setPendingSelectedTime(pendingTime)
                  }
                />
              </div>
            </div>
          )}
        </div>
      );
    },
  ),
);

export { CustomDateTimePicker };
