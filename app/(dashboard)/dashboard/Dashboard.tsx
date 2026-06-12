"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Chart } from "@/src/components/molecules";
import { useDashboardStore } from "@/src/store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { CARD_SHADOW, GRANULARITY_OPTIONS } from "@/src/utils";

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  loading,
  delta,
}: {
  label: string;
  value: number | string;
  icon: string;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  delta?: number | null;
}) {
  const deltaUp = (delta ?? 0) >= 0;

  return (
    <div
      className="bg-white flex items-center rounded-xl py-3 px-3 md:py-5 md:px-4 border border-[#D6D6D6]"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="w-full">
        <div
          className="rounded-lg flex p-[.625rem] md:p-[.875rem] w-fit items-center justify-center mb-3 md:mb-4"
          style={{ backgroundColor: iconBg }}
        >
          <Icon icon={icon} width="1.5rem" height="1.5rem" style={{ color: iconColor }} />
        </div>
        <p className="text-[#575757] text-sm mb-1">{label}</p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mb-3 md:mb-4" />
        ) : (
          <p className="text-xl md:text-[1.75rem] mb-3 md:mb-4 leading-7 md:leading-[2.25rem] font-[500] text-[#2B2B2B]">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
        <div className="flex gap-[.25rem] items-center min-h-[1.25rem]">
          {delta != null && (
            <>
              <span
                className={`p-[.125rem_.375rem] text-[.75rem] flex items-center gap-[.25rem] rounded-[.625rem] leading-5 font-[500] ${
                  deltaUp ? "bg-[#E7F6EC] text-[#036B26]" : "bg-[#FBEAE9] text-[#D42620]"
                }`}
              >
                <Icon
                  icon={deltaUp ? "hugeicons:arrow-up-right-01" : "hugeicons:arrow-down-left-01"}
                  className="w-4 h-4"
                />
                {Math.abs(delta).toLocaleString()}
              </span>
              <span className="text-[#757575] font-[500] leading-5 text-[.75rem]">
                from last month
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GranularityDropdown({
  granularity,
  setGranularity,
}: {
  granularity: string;
  setGranularity: (g: "day" | "week" | "month") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = GRANULARITY_OPTIONS.find((g) => g.value === granularity);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {active?.label ?? "Daily"}
        <Icon icon="hugeicons:arrow-down-01" className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
          {GRANULARITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setGranularity(opt.value as "day" | "week" | "month");
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                granularity === opt.value
                  ? "bg-[#F3F3F3] text-[#A12161] font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="block">{opt.label}</span>
              <span className="block text-xs text-gray-400">{opt.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const {
    stats,
    registrations,
    totalExams,
    examsCompleted,
    granularity,
    loading,
    setGranularity,
    fetchStats,
    fetchRegistrations,
    fetchExamCounts,
  } = useDashboardStore();
  const { user } = useAdminAuthStore();

  useEffect(() => {
    void fetchStats();
    void fetchRegistrations();
    void fetchExamCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-sm text-[#667085] mt-1">
          Here&apos;s your admin overview for today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Exams"
          value={totalExams}
          icon="hugeicons:book-open-01"
          iconBg="#E5E8F8"
          iconColor="#007FFF"
          loading={loading}
          delta={stats?.totalExamsDelta ?? null}
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon="hugeicons:user-group"
          iconBg="#F5E8F0"
          iconColor="#A12161"
          loading={loading}
          delta={stats?.totalUsersDelta ?? null}
        />
        <StatCard
          label="Exams Completed"
          value={examsCompleted}
          icon="hugeicons:checkmark-badge-01"
          iconBg="#E7F6EC"
          iconColor="#099137"
          loading={loading}
          delta={stats?.examsDelta ?? null}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — user breakdown */}
        <div
          className="bg-white rounded-xl p-4 border border-[#D6D6D6]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] mb-1">Total Users</p>
          <p className="text-xs text-[#667085] mb-4">Breakdown by role</p>

          {loading || !stats ? (
            <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-[400px]">
              <Chart
                type="pie"
                data={stats.userBreakdown}
                pieChartProps={{ isHollow: true }}
              />
            </div>
          )}
        </div>

        {/* Line chart — registrations over time */}
        <div
          className="bg-white rounded-xl p-4 border border-[#D6D6D6]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[#344054] mb-1">
                Registered Users
              </p>
              <p className="text-xs text-[#667085]">
                {GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.hint}
              </p>
            </div>
            <GranularityDropdown
              granularity={granularity}
              setGranularity={setGranularity}
            />
          </div>

          {loading ? (
            <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-[400px]">
              <Chart
                type="line"
                data={registrations as unknown as Record<string, unknown>[]}
                labelProps={[
                  { title: "Students", color: "#007FFF" },
                  { title: "Sponsors", color: "#A12161" },
                  { title: "Affiliates", color: "#099137" },
                ]}
                legendInfo={{ prefers: true }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
