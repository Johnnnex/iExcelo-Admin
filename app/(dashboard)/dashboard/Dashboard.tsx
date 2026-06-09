"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { Chart } from "@/src/components/molecules";
import { useDashboardStore } from "@/src/store";
import { CARD_SHADOW, GRANULARITY_OPTIONS } from "@/src/utils";

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-6 flex items-center gap-4"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon icon={icon} className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-[#667085] font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-[#101828] mt-0.5">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
      </div>
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

  useEffect(() => {
    void fetchStats();
    void fetchRegistrations();
    void fetchExamCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Exams"
          value={totalExams}
          icon="hugeicons:book-open-01"
          color="#007FFF"
          loading={loading}
        />
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon="hugeicons:user-group"
          color="#A12161"
          loading={loading}
        />
        <StatCard
          label="Exams Completed"
          value={examsCompleted}
          icon="hugeicons:checkmark-badge-01"
          color="#099137"
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — user breakdown */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-sm font-semibold text-[#344054] mb-1">Total Users</p>
          <p className="text-xs text-[#667085] mb-4">Breakdown by role</p>

          {loading || !stats ? (
            <div className="h-56 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-56">
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
          className="bg-white rounded-2xl p-6"
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
            {/* Granularity toggle */}
            <div className="flex gap-1 bg-[#F0F2F5] rounded-lg p-0.5">
              {GRANULARITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGranularity(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    granularity === opt.value
                      ? "bg-white text-[#344054] shadow-sm"
                      : "text-[#667085] hover:text-[#344054]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-48">
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
