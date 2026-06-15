"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAdminMessagesStore } from "@/src/store/messages.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminMessageFlag, FlagStatus } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: FlagStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
];

const STATUS_VARIANT: Record<FlagStatus, "warning" | "success" | "neutral"> = {
  pending: "warning",
  reviewed: "success",
  dismissed: "neutral",
};

// ─── Suspend User Modal ────────────────────────────────────────────────────────

function SuspendModal({
  flag,
  onClose,
}: {
  flag: IAdminMessageFlag;
  onClose: () => void;
}) {
  const { suspendUser } = useAdminMessagesStore();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const sender = flag.message?.sender;
  const name = sender
    ? `${sender.firstName} ${sender.lastName}`
    : (flag.message?.sender?.email ?? "this user");

  const handle = async () => {
    if (!date) return;
    setLoading(true);
    await suspendUser(flag.message?.sender?.id ?? "", date, onClose);
    setLoading(false);
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Suspend User</p>
        <p className="text-sm text-[#667085] mb-5">
          Suspend <span className="font-medium text-[#344054]">{name}</span>{" "}
          until:
        </p>
        <div className="flex flex-col gap-1 mb-5">
          <label className="text-sm font-medium text-[#344054]">
            Suspended Until
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            disabled={!date}
            className="flex-1 bg-[#D42620] hover:bg-[#b01e19] text-white"
          >
            Suspend
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Flag Detail Modal ─────────────────────────────────────────────────────────

function FlagDetailModal({
  flag,
  onClose,
}: {
  flag: IAdminMessageFlag;
  onClose: () => void;
}) {
  const sender = flag.message?.sender;
  const reporter = flag.reportedBy;

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-lg">
      <div className="flex items-center justify-between p-6 border-b border-[#E4E7EC]">
        <p className="font-semibold text-[#101828]">Flag Details</p>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#F2F4F7]"
        >
          <Icon icon="hugeicons:cancel-01" className="w-5 h-5 text-[#667085]" />
        </button>
      </div>
      <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <div>
          <p className="text-xs font-medium text-[#667085] uppercase tracking-wide mb-1">
            Flagged Message
          </p>
          <div className="bg-[#F9FAFB] rounded-lg p-4 border border-[#E4E7EC]">
            <p className="text-sm text-[#344054]">
              {flag.message?.content ?? "—"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#667085] mb-0.5">Sender</p>
            <p className="font-medium text-[#101828]">
              {sender ? `${sender.firstName} ${sender.lastName}` : "—"}
            </p>
            {sender?.email && (
              <p className="text-xs text-[#667085]">{sender.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#667085] mb-0.5">Reported By</p>
            <p className="font-medium text-[#101828]">
              {reporter ? `${reporter.firstName} ${reporter.lastName}` : "—"}
            </p>
            {reporter?.email && (
              <p className="text-xs text-[#667085]">{reporter.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#667085] mb-0.5">Reason</p>
            <p className="text-[#344054]">
              {flag.reason ?? "No reason provided"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#667085] mb-0.5">Chat Type</p>
            <p className="text-[#344054] capitalize">
              {flag.chatroom?.type?.replace(/_/g, " ") ?? "—"}
            </p>
          </div>
          {flag.adminNotes && (
            <div className="col-span-2">
              <p className="text-xs text-[#667085] mb-0.5">Admin Notes</p>
              <p className="text-[#344054]">{flag.adminNotes}</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 border-t border-[#E4E7EC]">
        <Button
          onClick={onClose}
          className="w-full bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type ModalState =
  | { type: "detail"; item: IAdminMessageFlag }
  | { type: "suspend"; item: IAdminMessageFlag }
  | null;

export default function Messages() {
  const {
    flags,
    total,
    page,
    loadingFlags,
    statusFilter,
    search,
    actingId,
    setStatusFilter,
    setPage,
    setSearch,
    fetchFlags,
    reviewFlag,
    dismissFlag,
  } = useAdminMessagesStore();

  const [searchInput, setSearchInput] = useState(search);
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);

  const canWriteMessages = canWrite(AdminModule.MESSAGES);

  useEffect(() => {
    void fetchFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<IAdminMessageFlag>[] = [
    {
      key: "message",
      header: "Message",
      render: (f) => (
        <div className="max-w-xs">
          <p className="text-sm text-[#344054] truncate">
            {f.message?.content ?? "—"}
          </p>
          <p className="text-xs text-[#667085]">
            {f.message?.sender
              ? `${f.message.sender.firstName} ${f.message.sender.lastName}`
              : "Unknown sender"}
          </p>
        </div>
      ),
    },
    {
      key: "reportedBy",
      header: "Reported By",
      render: (f) => (
        <span className="text-sm text-[#344054]">
          {f.reportedBy
            ? `${f.reportedBy.firstName} ${f.reportedBy.lastName}`
            : "—"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (f) => (
        <span className="text-sm text-[#667085]">{f.reason ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (f) => (
        <StatusChip
          label={f.status.charAt(0).toUpperCase() + f.status.slice(1)}
          variant={STATUS_VARIANT[f.status]}
        />
      ),
    },
    {
      key: "createdAt",
      header: "Flagged",
      render: (f) => (
        <span className="text-sm text-[#667085]">
          {new Date(f.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (f) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ type: "detail", item: f })}
            className="text-xs px-2.5 py-1 rounded-lg border border-[#667085] text-[#667085] hover:bg-[#F9FAFB] transition-colors"
          >
            View
          </button>
          {canWriteMessages && f.status === "pending" && (
            <>
              <button
                disabled={actingId === f.id}
                onClick={() => void reviewFlag(f.id)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors disabled:opacity-50"
              >
                {actingId === f.id ? "…" : "Review"}
              </button>
              <button
                disabled={actingId === f.id}
                onClick={() => void dismissFlag(f.id)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#667085] text-[#667085] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
              >
                {actingId === f.id ? "…" : "Dismiss"}
              </button>
              {f.message?.sender && (
                <button
                  onClick={() => setModal({ type: "suspend", item: f })}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
                >
                  Suspend
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Messages</h1>
          <p className="text-sm text-[#667085] mt-1">
            Review flagged messages reported by users
          </p>
        </div>
      </div>

      <div
        className="bg-white rounded-2xl flex flex-col"
        style={{ boxShadow: CARD_SHADOW }}
      >
        {/* Table header + filter */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Flagged Messages</p>
            <p className="text-sm text-[#667085]">{total} total</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FlagStatus | "")}
            className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          data={flags}
          loading={loadingFlags}
          keyExtractor={(f) => f.id}
          emptyMessage="No flagged messages found."
          shouldNotHaveBorder
          searchProps={{
            value: searchInput,
            onChange: setSearchInput,
            onSearch: () => setSearch(searchInput),
            placeholder: "Search messages...",
          }}
          pagination
          metaData={{
            currentPage: (page - 1) * 20 + 1,
            endPage: total > page * 20 ? page * 20 + 1 : (page - 1) * 20 + 1,
            totalRecords: total,
            onPageChange: (skip) => setPage(Math.floor(skip / 20) + 1),
          }}
        />
      </div>

      {modal?.type === "detail" && (
        <FlagDetailModal flag={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === "suspend" && (
        <SuspendModal flag={modal.item} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
