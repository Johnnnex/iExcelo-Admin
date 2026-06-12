"use client";

import { Chart } from "@/src/components/molecules";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useAnalyticsStore } from "@/src/store/analytics.store";
import { CARD_SHADOW, GRANULARITY_OPTIONS } from "@/src/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtProgressLabel(iso: string, granularity: string): string {
  const d = new Date(iso + "T12:00:00Z");
  if (granularity === "month")
    return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  if (granularity === "week") {
    const end = new Date(d);
    end.setUTCDate(d.getUTCDate() + 6);
    const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    return `${month} ${d.getUTCDate()}–${end.getUTCDate()}`;
  }
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center w-full h-full">
    <Icon icon="svg-spinners:ring-resize" className="w-8 h-8 text-[#007FFF]" />
  </div>
);

const EmptyChart = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <Icon icon="hugeicons:chart-evaluation" className="w-12 h-12 text-gray-300 mb-3" />
    <p className="text-[#757575] text-sm">{label}</p>
  </div>
);

function GranularityDropdown({
  value,
  onChange,
}: {
  value: "day" | "week" | "month";
  onChange: (v: "day" | "week" | "month") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0 self-start">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
      >
        {GRANULARITY_OPTIONS.find((o) => o.value === value)?.label}
        <Icon icon="hugeicons:arrow-down-01" className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute left-0 md:left-auto md:right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === option.value
                  ? "bg-[#F3F3F3] text-[#A12161] font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="block">{option.label}</span>
              <span className="block text-xs text-gray-400">{option.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

const SkeletonChart = ({ cols = 1 }: { cols?: number }) => (
  <div
    style={{ boxShadow: CARD_SHADOW }}
    className={`bg-white rounded-xl p-3 border border-[#D6D6D6] ${cols === 2 ? "lg:col-span-2" : ""}`}
  >
    <div className="animate-pulse">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 px-[.5rem] gap-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-100 rounded w-48" />
          <div className="h-3 bg-gray-100 rounded w-36" />
        </div>
        <div className="h-9 bg-gray-100 rounded-lg w-32" />
      </div>
      <div className="h-[320px] bg-gray-100 rounded" />
    </div>
  </div>
);

const SkeletonPie = () => (
  <div
    style={{ boxShadow: CARD_SHADOW }}
    className="bg-white rounded-xl p-3 border border-[#D6D6D6] flex flex-col"
  >
    <div className="animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-gray-100 rounded w-44" />
        <div className="h-3 bg-gray-100 rounded w-32" />
      </div>
      <div className="h-[280px] bg-gray-100 rounded" />
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const Analytics = () => {
  const {
    kpis,
    examCompletions,
    subjectPerformance,
    questionDistribution,
    revenueOverTime,
    examTypeBreakdown,
    completionsGranularity,
    revenueGranularity,
    isLoadingKpis,
    isLoadingCompletions,
    isLoadingSubjects,
    isLoadingDistribution,
    isLoadingRevenue,
    isLoadingExamTypes,
    setCompletionsGranularity,
    setRevenueGranularity,
    fetchAll,
  } = useAnalyticsStore();

  const completionsLoaded = useRef(false);
  const subjectsLoaded = useRef(false);
  const distLoaded = useRef(false);
  const revenueLoaded = useRef(false);
  const examTypesLoaded = useRef(false);

  useEffect(() => {
    fetchAll().then(() => {
      completionsLoaded.current = true;
      subjectsLoaded.current = true;
      distLoaded.current = true;
      revenueLoaded.current = true;
      examTypesLoaded.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chart data transforms ──────────────────────────────────────────────────

  const completionsData = examCompletions.map((p) => ({
    name: fmtProgressLabel(p.name, completionsGranularity),
    Completions: p.Completions,
  }));

  const revenueData = revenueOverTime.map((p) => ({
    name: fmtProgressLabel(p.name, revenueGranularity),
    Revenue: p.Revenue,
    Subscriptions: p.Subscriptions,
  }));

  const distTotal = questionDistribution.reduce((s, d) => s + d.value, 0);

  const kpiCards = [
    {
      icon: "hugeicons:checkmark-circle-02",
      iconBg: "#E5E8F8",
      iconColor: "#007FFF",
      label: "Exam Completions",
      value: kpis ? kpis.totalCompletions.toLocaleString() : "—",
      sub: "All time",
    },
    {
      icon: "hugeicons:target-01",
      iconBg: "#E7F6EC",
      iconColor: "#036B26",
      label: "Platform Avg Score",
      value: kpis ? `${kpis.avgScore}%` : "—",
      sub: "Across all exams",
    },
    {
      icon: "hugeicons:money-bag-01",
      iconBg: "#FFF3E0",
      iconColor: "#F3A218",
      label: "Revenue (30 days)",
      value: kpis ? `₦${kpis.totalRevenue.toLocaleString()}` : "—",
      sub: "Last 30 days",
    },
    {
      icon: "hugeicons:quiz-04",
      iconBg: "#F3E5F5",
      iconColor: "#A12161",
      label: "Questions Answered",
      value: kpis ? kpis.totalQuestions.toLocaleString() : "—",
      sub: "All time",
    },
  ];

  return (
    <div>
      {/* Header */}
      <section className="mb-5">
        <h1 className="text-xl md:text-2xl font-[600] text-[#171717]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform-wide activity — exams, revenue, subjects, and question patterns
        </p>
      </section>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white flex items-center rounded-xl py-3 px-3 md:py-5 md:px-4 border border-[#D6D6D6]"
          >
            <div className="w-full">
              <div
                className="rounded-lg flex p-[.625rem] md:p-[.875rem] w-fit items-center justify-center mb-3 md:mb-4"
                style={{ background: card.iconBg }}
              >
                <Icon
                  icon={card.icon}
                  height="1.5rem"
                  width="1.5rem"
                  style={{ color: card.iconColor }}
                />
              </div>
              <p className="text-[#575757] text-sm mb-1">{card.label}</p>
              {isLoadingKpis ? (
                <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mb-3" />
              ) : (
                <p className="text-xl md:text-[1.75rem] mb-3 md:mb-4 leading-7 md:leading-[2.25rem] font-[500] text-[#2B2B2B]">
                  {card.value}
                </p>
              )}
              <p className="text-[#757575] font-[500] leading-5 text-[.75rem]">{card.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Exam Completions + Question Distribution ───────────────────────── */}
      <section className="grid mt-5 grid-cols-1 items-stretch lg:grid-cols-3 gap-6">
        {/* Chart 1: Exam Completions Over Time */}
        {!completionsLoaded.current && isLoadingCompletions ? (
          <div className="lg:col-span-2">
            <SkeletonChart cols={2} />
          </div>
        ) : (
          <div
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white lg:col-span-2 rounded-xl p-3 border border-[#D6D6D6]"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-3">
              <div className="shrink-0">
                <h3 className="font-[500] text-base md:text-[1.125rem] text-gray-900">
                  Exam Completions
                </h3>
                <p className="text-[#757575] text-[.875rem] font-[400] leading-5">
                  {completionsGranularity === "day"
                    ? "Days this week"
                    : completionsGranularity === "week"
                      ? "Weeks this month"
                      : "Months this year"}
                </p>
              </div>
              <GranularityDropdown
                value={completionsGranularity}
                onChange={setCompletionsGranularity}
              />
            </div>
            <div className="h-[320px]">
              {isLoadingCompletions ? (
                <Spinner />
              ) : completionsData.length === 0 ? (
                <EmptyChart label="No completions data for this period" />
              ) : (
                <Chart
                  type="line"
                  data={completionsData}
                  labelProps={[{ title: "Completions", color: "#007FFF" }]}
                  prefersToolTip
                  lineChartProps={{ line: { strokeWidth: 4 } as never }}
                />
              )}
            </div>
          </div>
        )}

        {/* Chart 2: Question Distribution (pie) */}
        {!distLoaded.current && isLoadingDistribution ? (
          <SkeletonPie />
        ) : (
          <div
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white rounded-xl p-3 border border-[#D6D6D6] flex flex-col"
          >
            <div className="mb-4">
              <h3 className="font-[500] text-base md:text-[1.125rem] text-gray-900">
                Question Distribution
              </h3>
              <p className="text-[#757575] text-[.875rem] font-[400] leading-5">
                Total answered: {distTotal.toLocaleString()}
              </p>
            </div>
            <div className="flex-1 min-h-[280px]">
              {isLoadingDistribution ? (
                <Spinner />
              ) : questionDistribution.length === 0 ? (
                <EmptyChart label="No questions answered yet" />
              ) : (
                <Chart
                  type="pie"
                  data={questionDistribution}
                  pieChartProps={{ isHollow: true }}
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Subject Performance + Exam Type Breakdown ─────────────────────── */}
      <section className="grid mt-5 grid-cols-1 items-stretch lg:grid-cols-3 gap-6">
        {/* Chart 3: Subject Performance (bar) */}
        {!subjectsLoaded.current && isLoadingSubjects ? (
          <div className="lg:col-span-2">
            <SkeletonChart cols={2} />
          </div>
        ) : (
          <div
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white lg:col-span-2 rounded-xl p-3 border border-[#D6D6D6]"
          >
            <div className="mb-3">
              <h3 className="font-[500] text-base md:text-[1.125rem] text-gray-900">
                Subject Performance
              </h3>
              <p className="text-[#757575] text-[.875rem] font-[400] leading-5">
                Average accuracy (%) across top subjects platform-wide
              </p>
            </div>
            <div className="h-[320px]">
              {isLoadingSubjects ? (
                <Spinner />
              ) : subjectPerformance.length === 0 ? (
                <EmptyChart label="No subject data available" />
              ) : (
                <Chart
                  type="bar"
                  data={subjectPerformance}
                  labelProps={[
                    {
                      title: "Accuracy",
                      color: "#007FFF",
                      barSize: 28,
                      radius: [4, 4, 0, 0],
                    },
                  ]}
                  prefersToolTip
                  yAxis={{ domain: [0, 100] }}
                />
              )}
            </div>
          </div>
        )}

        {/* Chart 4: Exam Type Breakdown (bar, colored) */}
        {!examTypesLoaded.current && isLoadingExamTypes ? (
          <SkeletonChart />
        ) : (
          <div
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white rounded-xl p-3 border border-[#D6D6D6] flex flex-col"
          >
            <div className="mb-4">
              <h3 className="font-[500] text-base md:text-[1.125rem] text-gray-900">
                Exam Types
              </h3>
              <p className="text-[#757575] text-[.875rem] font-[400] leading-5">
                Completions per exam type
              </p>
            </div>
            <div className="flex-1 min-h-[280px]">
              {isLoadingExamTypes ? (
                <Spinner />
              ) : examTypeBreakdown.length === 0 ? (
                <EmptyChart label="No exam type data" />
              ) : (
                <Chart
                  type="bar"
                  data={examTypeBreakdown}
                  labelProps={[
                    {
                      title: "Completions",
                      color: "#A12161",
                      barSize: 30,
                      radius: [4, 4, 0, 0],
                      useDataFill: true,
                    },
                  ]}
                  prefersToolTip
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Revenue Over Time ─────────────────────────────────────────────── */}
      <section className="mt-5">
        {!revenueLoaded.current && isLoadingRevenue ? (
          <SkeletonChart />
        ) : (
          <div
            style={{ boxShadow: CARD_SHADOW }}
            className="bg-white rounded-xl p-3 border border-[#D6D6D6]"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-3">
              <div className="shrink-0">
                <h3 className="font-[500] text-base md:text-[1.125rem] text-gray-900">
                  Revenue & Subscriptions
                </h3>
                <p className="text-[#757575] text-[.875rem] font-[400] leading-5">
                  {revenueGranularity === "day"
                    ? "Days this week"
                    : revenueGranularity === "week"
                      ? "Weeks this month"
                      : "Months this year"}
                </p>
              </div>
              <GranularityDropdown
                value={revenueGranularity}
                onChange={setRevenueGranularity}
              />
            </div>
            <div className="h-[380px]">
              {isLoadingRevenue ? (
                <Spinner />
              ) : revenueData.length === 0 ? (
                <EmptyChart label="No revenue data for this period" />
              ) : (
                <Chart
                  type="area"
                  data={revenueData}
                  labelProps={[
                    {
                      title: "Revenue",
                      color: "#007FFF",
                      barSize: 28,
                      radius: [4, 4, 0, 0],
                    },
                    {
                      title: "Subscriptions",
                      color: "#A12161",
                      barSize: 28,
                      radius: [4, 4, 0, 0],
                    },
                  ]}
                  prefersToolTip
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analytics;
