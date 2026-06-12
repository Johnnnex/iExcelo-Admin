/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { memo, ReactNode, useEffect, useRef, useState } from "react";
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
  onPageChange?: (skip: number) => void;
};

type SearchProps = {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
  placeholder?: string;
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
  searchProps?: SearchProps;
  shouldNotHaveBorder?: boolean;
  nonScrollable?: boolean;
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
  searchProps,
  shouldNotHaveBorder = false,
  nonScrollable = false,
}: DataTableProps<T>) {
  const [isBottom, setIsBottom] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);

  const onSearchRef = useRef(searchProps?.onSearch);
  useEffect(() => {
    onSearchRef.current = searchProps?.onSearch;
  }, [searchProps?.onSearch]);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      onSearchRef.current?.();
    }, 500);
  };

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
  }, [JSON.stringify(data)]);

  const containerHeight = loading
    ? "700px"
    : data.length
      ? nonScrollable
        ? `${(99 * data.length + 45) / 16}rem`
        : `${(99 * (data.length > 10 ? 10 : data.length) + 47) / 16}rem`
      : "550px";

  return (
    <section
      className={`flex h-full flex-1 flex-col overflow-hidden ${
        shouldNotHaveBorder ? "" : "rounded-2xl border border-[#E4E7EC]"
      } ${className ?? ""}`}
    >
      {searchProps && (
        <div className="relative mb-3 flex items-center justify-between p-4">
          <div className="relative h-fit w-fit">
            <input
              onChange={(e) => {
                const value = e.target.value;
                searchProps.onChange(value);
                handleSearch(value);
              }}
              placeholder={
                searchProps.placeholder ?? "Searching for something?"
              }
              type="text"
              value={searchProps.value}
              className="w-[20rem] rounded-lg border border-[#D0D5DD] py-[0.625rem] pl-[2.4rem] pr-[.875rem] text-sm font-normal leading-4 text-[#667085] outline-none shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
            />
            <div className="absolute top-0 ml-[.875rem] flex h-full items-center justify-center">
              <Icon
                icon="hugeicons:search-01"
                className="w-4 h-4 text-[#667085]"
              />
            </div>
          </div>
        </div>
      )}
      <div
        ref={container}
        className="relative overflow-auto"
        style={{ height: containerHeight }}
      >
        <style jsx>{`
          div :global(table) {
            width: 100%;
            height: fit-content;
          }
          div :global(th:after) {
            bottom: -1px;
            width: 100%;
            left: 0;
            position: absolute;
            content: "";
            border-bottom: 1px solid #f1f1f1 !important;
          }
          div :global(.last-row) {
            border-bottom: none !important;
          }
          div :global(thead) {
            background-color: #fff;
            position: sticky;
            z-index: 3;
            top: 0;
            height: fit-content;
          }
        `}</style>
        <table
          style={{
            borderCollapse: "collapse",
            overflow: "auto",
            height: "100%",
          }}
        >
          <thead className="sticky top-0 z-[50] h-fit bg-white">
            <tr className="h-[46px] min-h-[46px] overflow-hidden">
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
                <td
                  colSpan={columns.length + 1}
                  className="last-row"
                  height="620px"
                >
                  <div className="flex h-full w-full flex-col overflow-hidden">
                    {Array.from({ length: 10 }, (_, index) => (
                      <div
                        key={`pulse__child__${index}`}
                        className={`min-h-[6em] ${
                          index % 2 === 0 ? "pulse bg-[#f5f5f9b8]" : "bg-[#fff]"
                        }`}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ) : !data.length ? (
              <tr className="h-fit w-full bg-white">
                <td
                  colSpan={columns.length + 1}
                  className="last-row mx-auto"
                  height="500px"
                >
                  <div className="mx-auto flex h-full max-w-[30.1875rem] flex-col items-center justify-center bg-transparent">
                    <Icon
                      className="w-15 h-15"
                      icon={
                        emptyStateProps?.icon ?? "hugeicons:shopping-cart-02"
                      }
                    />
                    <h4 className="mb-3 text-center text-[1.75rem] font-medium leading-[2.125rem] text-black">
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
                  style={{
                    backgroundColor: rowIndex % 2 ? "#FCFCFD" : "#fff",
                  }}
                >
                  <td
                    className={`${geistSans.className} h-24 px-6 py-2 text-sm font-medium leading-[18.9px] text-[#A7AEB1] ${
                      rowIndex === data.length - 1 && isBottom ? "last-row" : ""
                    }`}
                  >
                    {pagination ? (metaData?.currentPage ?? 1) + rowIndex : rowIndex + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ width: col.width }}
                      className={`h-24 px-6 py-4 text-sm font-normal leading-[120%] ${
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
              className={`m-auto flex flex-row items-center border border-[#EAECF0] px-4 py-3 transition-all duration-200 ${
                isBottom
                  ? "w-full rounded-b-lg border-b-0 border-l-0 border-r-0 border-t bg-white justify-between"
                  : "w-fit rounded-lg bg-[#FFFFFFEE] justify-center gap-3"
              }`}
            >
              {isBottom && (
                loading ? (
                  <div className="pulse h-[15px] w-[200px] rounded-[10px] bg-[#f5f5f9]" />
                ) : (
                  <div className="text-sm font-semibold leading-[142.857%] text-[#202224] opacity-60">
                    Showing {metaData?.currentPage ?? 1}–{
                      metaData?.endPage === metaData?.currentPage
                        ? metaData?.totalRecords ?? 1
                        : (metaData?.endPage ?? 2) - 1
                    } of {metaData?.totalRecords ?? 1}
                  </div>
                )
              )}
              <div className={`flex items-center ${isBottom ? "gap-[1.375rem]" : "gap-3"}`}>
                <button
                  onClick={() =>
                    metaData?.onPageChange?.(
                      Math.max(0, (metaData?.currentPage || 0) - 50 - 1) || 0,
                    )
                  }
                  disabled={loading || metaData?.currentPage === 1}
                  className="min-h-0 min-w-0 rounded-lg border border-[#D0D5DD] p-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:cursor-not-allowed"
                >
                  <Icon
                    style={{
                      color:
                        loading || metaData?.currentPage === 1
                          ? "#34405490"
                          : "#344054",
                    }}
                    icon={"hugeicons:arrow-left-01"}
                    className="w-5 h-5"
                  />
                </button>
                {!isBottom && (
                  <span className="min-w-[4.5rem] text-center text-sm font-semibold text-[#344054] opacity-70 select-none">
                    {metaData?.currentPage ?? 1}–{
                      metaData?.endPage === metaData?.currentPage
                        ? metaData?.totalRecords ?? 1
                        : (metaData?.endPage ?? 2) - 1
                    }
                  </span>
                )}
                <button
                  onClick={() =>
                    metaData?.onPageChange?.(metaData?.endPage || 1)
                  }
                  disabled={
                    loading || metaData?.endPage === metaData?.currentPage
                  }
                  className="min-h-0 min-w-0 rounded-lg border border-[#D0D5DD] p-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:cursor-not-allowed"
                >
                  <Icon
                    icon={"hugeicons:arrow-right-01"}
                    style={{
                      color:
                        loading || metaData?.endPage === metaData?.currentPage
                          ? "#34405490"
                          : "#344054",
                    }}
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

const Table = memo(DataTable) as typeof DataTable;

export { DataTable, Table };
