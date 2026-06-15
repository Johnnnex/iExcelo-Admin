/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import { ReactNode } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
  XAxisProps,
  CartesianGridProps,
  ResponsiveContainer,
  ResponsiveContainerProps,
  BarChart,
  Legend,
  Bar,
  YAxisProps,
  LabelProps,
  Pie,
  PieChart,
  LegendProps,
  AreaChart,
  Area,
  Cell,
} from "recharts";

type IChartTypes = {
  type?: "line" | "bar" | "pie" | "area";
  data?: any[];
  noAxis?: boolean;
  labelProps?: {
    title: string;
    color: string;
    colorId?: string;
    barSize?: number;
    radius?: [number, number, number, number];
    /** If true, each bar reads its color from data[i].fill (falls back to color) */
    useDataFill?: boolean;
  }[];
  prefersToolTip?: boolean;
  legendInfo?: {
    prefers: boolean;
    align?: "vertical" | "horizontal";
    offset?: "in-context" | "out-context";
  };
  responsiveContainerProps?: ResponsiveContainerProps;
  xAxis?: XAxisProps;
  yAxis?: YAxisProps;
  toolTip?: TooltipProps<number, string>;
  legend?: LegendProps;
  label?: LabelProps;
  cartesianGrid?: CartesianGridProps;
  lineChartProps?: {
    lineChart?: typeof LineChart;
    line?: Record<string, any>;
  };
  barChartProps?: {
    type?: "stack" | "side";
    barChart?: typeof BarChart;
    bar?: typeof Bar;
  };
  pieChartProps?: {
    pieChart?: typeof PieChart;
    pie?: typeof Pie;
    isHollow?: boolean;
  };
  customToolTip?: () => ReactNode;
  customLegend?: () => ReactNode;
};

/** Compact Y-axis tick: 6000 → 6k, 6500 → 6.5k, 1200000 → 1.2M, etc. */
const formatYAxisTick = (value: number): string => {
  if (value >= 1_000_000_000) return `${+(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${+(value / 1_000).toFixed(1)}k`;
  return String(value);
};

const CustomLegend = (props: LegendProps & { payload?: [any] }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      gap: ".9rem",
      position: "absolute",
      top: "-22rem",
      right: "0",
      width: "fit-content",
    }}
  >
    {props?.payload?.map((entry, index) => (
      <div
        key={`item-${index}`}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: ".5rem",
        }}
      >
        <div
          style={{
            width: ".5rem",
            height: ".5rem",
            backgroundColor: entry.color,
            borderRadius: "50%",
          }}
        />
        <span
          style={{
            fontSize: ".85rem",
            color: "#667185",
          }}
        >
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

const CustomTooltip: React.FC<
  TooltipProps<number, string> & { payload?: [any]; label?: any }
> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-[0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)] border border-[#EAECF0] rounded-[.5rem] min-w-[13.25rem] p-[.625rem_.375rem]">
        <p className="p-[.625rem] bg-[#F9FAFB] rounded-[.375rem] text-center font-[700] text-[.875rem] leading-[1.5rem]">
          {label}
        </p>
        <div className="flex mt-[.5rem] flex-col gap-[.25rem]">
          {payload.map(({ name, value, color }, index) => (
            <div
              key={`tooltip__item__${index}__${name}`}
              className="flex p-[.625rem] border-[.5px] border-[#00000009] rounded-[.5rem] gap-[.5rem] items-center"
            >
              <span
                style={{ backgroundColor: color }}
                className="rounded-[50%] h-[.5rem] aspect-square"
              />
              <p className="text-[#475467] leading-[1.25rem] text-[.875rem] font-[400]">
                {name}: <span className="font-[700]">{value}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const CustomPieLegend = (props: LegendProps & { payload?: [any] }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: ".6rem",
      fontFamily: "var(--font-geist-sans, Geist, sans-serif)",
    }}
  >
    {props?.payload?.map((entry, index) => (
      <div
        key={`item-${index}`}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: ".5rem",
        }}
      >
        <div
          style={{
            width: ".5rem",
            height: ".5rem",
            flexShrink: 0,
            backgroundColor: entry.color,
            borderRadius: "50%",
          }}
        />
        <span
          style={{
            fontSize: ".8rem",
            color: "#667185",
            whiteSpace: "nowrap",
          }}
        >
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

const Chart = ({
  data: userData,
  labelProps,
  customLegend: userBasedLegend,
  customToolTip: userBasedToolTip,
  type = "line",
  ...props
}: IChartTypes) => {
  switch (type) {
    case "line":
      return (
        <ResponsiveContainer
          width={"100%"}
          height={"100%"}
          style={{ position: "relative" }}
          {...props?.responsiveContainerProps}
        >
          <LineChart
            data={userData ?? []}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            {...props?.lineChartProps?.lineChart}
          >
            {labelProps?.map((prop, index) => (
              <Line
                key={`line___${index}__${prop.title}`}
                dot={false}
                activeDot={false}
                strokeWidth={2}
                type="bumpX"
                dataKey={prop?.title}
                stroke={prop?.color}
                {...props?.lineChartProps?.line}
              />
            ))}
            <CartesianGrid
              stroke="#F0F2F5"
              strokeDasharray="1 1"
              vertical={false}
              {...props?.cartesianGrid}
            />
            {!props?.noAxis && (
              <>
                <XAxis
                  stroke="#A6A6A6"
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  dataKey="name"
                  {...props?.xAxis}
                />
                <YAxis
                  stroke="#A6A6A6"
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  tickFormatter={formatYAxisTick}
                  {...({ strokeWidth: "0" } as any)}
                  {...props?.yAxis}
                  ref={null}
                />
              </>
            )}
            <Tooltip
              cursor={false}
              content={
                (!!userBasedToolTip ? (
                  userBasedToolTip
                ) : (
                  <CustomTooltip />
                )) as any
              }
              {...(props?.toolTip as any)}
            />
            {props?.legendInfo?.prefers && (
              <Legend
                content={!!userBasedLegend ? userBasedLegend : <CustomLegend />}
                {...props?.legend}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    case "area":
      return (
        <ResponsiveContainer
          width={"100%"}
          height={"100%"}
          style={{
            position: "relative",
          }}
          {...props?.responsiveContainerProps}
        >
          <AreaChart
            data={userData ?? []}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              {labelProps?.map((prop, index) => (
                <linearGradient
                  key={`__linear__gradient__${index}__${prop?.title}`}
                  id={`color${prop?.colorId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={prop?.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={prop?.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {!props?.noAxis && (
              <>
                <XAxis
                  stroke="#A6A6A6"
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  dataKey="name"
                  {...props?.xAxis}
                />
                <YAxis
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  tickFormatter={formatYAxisTick}
                  {...({ strokeWidth: "0" } as any)}
                  stroke="#A6A6A6"
                  {...props?.yAxis}
                  ref={null}
                />
              </>
            )}
            <CartesianGrid
              stroke="#F2F4F7"
              strokeDasharray="1 1"
              vertical={false}
              {...props?.cartesianGrid}
            />
            {props?.prefersToolTip && (
              <Tooltip
                cursor={false}
                content={
                  (!!userBasedToolTip ? (
                    userBasedToolTip
                  ) : (
                    <CustomTooltip />
                  )) as any
                }
                {...(props?.toolTip as any)}
              />
            )}
            {props?.legendInfo?.prefers && (
              <Legend
                content={!!userBasedLegend ? userBasedLegend : <CustomLegend />}
                {...props?.legend}
              />
            )}
            {labelProps?.map((prop, index) => (
              <Area
                key={`area___${index}__${prop.title}`}
                type="bumpX"
                dataKey={prop?.title}
                stroke={prop?.color}
                fillOpacity={1}
                fill={`url(#color${prop.colorId})`}
                strokeWidth={2}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    case "bar":
      return (
        <ResponsiveContainer
          width={"100%"}
          height={"100%"}
          style={{ position: "relative" }}
          {...props?.responsiveContainerProps}
        >
          <BarChart
            barGap={0}
            data={userData ?? []}
            style={{}}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            {...props?.barChartProps?.barChart}
          >
            <CartesianGrid
              stroke="#F0F2F5"
              strokeDasharray="1 1"
              vertical={false}
              {...props?.cartesianGrid}
            />
            {!props?.noAxis && (
              <>
                <XAxis
                  stroke="#A6A6A6"
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  dataKey="name"
                  {...props?.xAxis}
                />
                <YAxis
                  stroke="#A6A6A6"
                  tick={{
                    fontSize: "0.75rem",
                    fill: "#757575",
                    fontWeight: 400,
                  }}
                  tickFormatter={formatYAxisTick}
                  {...({ strokeWidth: "0" } as any)}
                  {...props?.yAxis}
                  ref={null}
                />
              </>
            )}
            {labelProps?.map((prop, index) => (
              <Bar
                key={`bar___${index}__${prop.title}`}
                dataKey={prop?.title}
                barSize={prop?.barSize ?? 30}
                fill={prop?.color}
                radius={prop?.radius! ?? [4, 4, 0, 0]}
                stackId={
                  props?.barChartProps?.type === "stack" ? "stack" : index
                }
                {...props?.barChartProps?.bar}
              >
                {prop.useDataFill &&
                  (userData ?? []).map((entry: any, i: number) => (
                    <Cell key={`cell-${i}`} fill={entry.fill ?? prop.color} />
                  ))}
              </Bar>
            ))}
            {props?.prefersToolTip && (
              <Tooltip
                cursor={false}
                content={
                  (!!userBasedToolTip ? (
                    userBasedToolTip
                  ) : (
                    <CustomTooltip />
                  )) as any
                }
                {...(props?.toolTip as any)}
              />
            )}
            {props?.legendInfo?.prefers && (
              <Legend
                content={!!userBasedLegend ? userBasedLegend : <CustomLegend />}
                {...props?.legend}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer
          width={"100%"}
          height={"100%"}
          {...props?.responsiveContainerProps}
        >
          <PieChart {...props?.pieChartProps?.pieChart}>
            <Pie
              data={userData ?? []}
              dataKey="value"
              nameKey="name"
              cx="60%"
              cy="50%"
              outerRadius={"80%"}
              innerRadius={props?.pieChartProps?.isHollow ? 0 : "50%"}
              {...props?.pieChartProps?.pie}
            />
            {!((userData?.length || 0) > 5) && (
              <Legend
                content={
                  !!userBasedLegend ? userBasedLegend : <CustomPieLegend />
                }
                layout="vertical"
                align="left"
                verticalAlign="bottom"
                {...props?.legend}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      );
  }
};

export { Chart };
