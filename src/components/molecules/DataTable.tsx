"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { geistSans } from "@/src/lib/fonts";

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  customTableHead?: (value: string) => ReactNode;
  render?: (row: T) => ReactNode;
}

type MetaDataOptions = {
  endPage?: number;
  currentPage?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  className?: string;
  numberColName?: string;
  pagination?: boolean;
  metaData?: MetaDataOptions;
  emptyStateProps?: {
    icon?: string;
    title?: string;
    text?: string;
  };
}

function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No records found",
  keyExtractor,
  className,
  numberColName,
  emptyStateProps,
  pagination,
  metaData,
}: DataTableProps<T>) {
  const [isBottom, setIsBottom] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);

  const handleScroll = () => {
    if (container.current) {
      const { scrollTop, scrollHeight, clientHeight } = container.current;
      setIsBottom(scrollTop + clientHeight >= scrollHeight);
    }
  };

  useEffect(() => {
    handleScroll();
    const parent = container.current;
    if (parent) {
      parent.addEventListener("scroll", handleScroll);
      return () => parent.removeEventListener("scroll", handleScroll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  const isPrevDisabled = loading || (metaData?.currentPage ?? 1) <= 1;
  const isNextDisabled =
    loading || (metaData?.currentPage ?? 1) >= (metaData?.endPage ?? 1);

  return (
    <section className={`flex flex-col overflow-hidden ${className ?? ""}`}>
      <div ref={container} className="relative max-h-full overflow-auto">
        <style jsx>{`
          div :global(th:after) {
            bottom: -1px;
            width: 100%;
            left: 0;
            position: absolute;
            content: "";
            border-bottom: 1px solid #f1f1f1 !important;
          }
        `}</style>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            height: "fit-content",
          }}
        >
          <thead className="sticky top-0 z-2 bg-white h-fit">
            <tr className="h-11.5 min-h-11.5">
              <th
                className={`${geistSans.className} px-6 py-2 text-left text-xs font-medium leading-4 text-[#475467]`}
              >
                {numberColName ?? "S/N"}
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  align="left"
                  style={{ width: col.width }}
                  className="px-6 py-2 text-xs font-medium leading-4 text-[#475467]"
                >
                  {col.customTableHead
                    ? col.customTableHead(col.header)
                    : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="h-fit w-full bg-white">
                <td colSpan={columns.length + 1} height="620px">
                  <div className="flex h-full w-full flex-col overflow-hidden">
                    {Array.from({ length: 10 }, (_, index) => (
                      <div
                        key={`pulse__child__${index}`}
                        className={`min-h-[6em] ${index % 2 === 0 ? "pulse bg-[#f5f5f9b8]" : "bg-white"}`}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr className="bg-white">
                <td
                  colSpan={columns.length + 1}
                  className="px-4"
                  style={{ height: "500px" }}
                >
                  <div className="mx-auto flex h-full max-w-120.75 flex-col items-center justify-center bg-transparent">
                    <Icon
                      className="w-15 h-15"
                      icon={emptyStateProps?.icon ?? "hugeicons:folder-open"}
                    />
                    <h4 className="mb-3 text-center text-[1.75rem] font-medium leading-8.5 text-black">
                      {emptyStateProps?.title ?? "No Data"}
                    </h4>
                    <p className="mb-6 text-center text-base font-normal leading-6">
                      {emptyStateProps?.text ?? emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={keyExtractor(row)}
                  style={{ backgroundColor: rowIndex % 2 ? "#FCFCFD" : "#fff" }}
                >
                  <td
                    className={`${geistSans.className} h-24 px-6 py-2 text-sm font-medium leading-[18.9px] text-[#A7AEB1] ${
                      rowIndex === data.length - 1 && isBottom ? "last-row" : ""
                    }`}
                  >
                    {rowIndex + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ width: col.width }}
                      className={`h-24 px-6 py-2 text-sm font-normal leading-[120%] ${
                        rowIndex === data.length - 1 && isBottom
                          ? "last-row"
                          : ""
                      }`}
                    >
                      {col.render
                        ? col.render(row)
                        : String(
                            (row as Record<string, unknown>)[col.key] ?? "",
                          )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && (
          <section
            className="sticky transition-all duration-200"
            style={{ bottom: isBottom ? "0px" : "12px" }}
          >
            <div
              className={`m-auto flex min-w-fit flex-row items-center justify-between border border-[#EAECF0] px-4 py-3 transition-all duration-200 ${
                isBottom
                  ? "w-full rounded-b-lg border-b-0 border-l-0 border-r-0 border-t bg-white"
                  : "w-0 rounded-lg bg-[#FFFFFFEE]"
              }`}
            >
              {loading ? (
                <div className="pulse h-3.75 w-50 rounded-[10px] bg-[#f5f5f9]" />
              ) : (
                <div
                  className={`overflow-hidden text-sm font-semibold leading-[142.857%] text-[#202224] opacity-60 transition-all duration-200 ${
                    isBottom ? "block" : "hidden"
                  }`}
                >
                  Showing {metaData?.currentPage || 1}-{metaData?.endPage || 1}{" "}
                  of {metaData?.totalRecords || 1}
                </div>
              )}
              <div className="flex items-center gap-5.5">
                <button
                  onClick={() =>
                    metaData?.onPageChange?.(
                      Math.max(1, (metaData?.currentPage || 1) - 1),
                    )
                  }
                  disabled={isPrevDisabled}
                  className="min-h-0 min-w-0 rounded-lg border border-[#D0D5DD] p-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:cursor-not-allowed"
                >
                  <Icon
                    style={{ color: isPrevDisabled ? "#34405490" : "#344054" }}
                    icon="hugeicons:arrow-left-01"
                    className="w-5 h-5"
                  />
                </button>
                <button
                  onClick={() =>
                    metaData?.onPageChange?.(
                      Math.min(
                        metaData?.endPage || 1,
                        (metaData?.currentPage || 1) + 1,
                      ),
                    )
                  }
                  disabled={isNextDisabled}
                  className="disabled:cursor-not-allowed"
                  style={{
                    padding: ".5rem",
                    minHeight: 0,
                    minWidth: 0,
                    border: "1px solid #D0D5DD",
                    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                    borderRadius: ".5rem",
                  }}
                >
                  <Icon
                    icon="hugeicons:arrow-right-01"
                    style={{ color: isNextDisabled ? "#34405490" : "#344054" }}
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

export { DataTable };
