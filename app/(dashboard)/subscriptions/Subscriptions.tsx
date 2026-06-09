"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAdminSubscriptionsStore } from "@/src/store/subscriptions.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminSubscription } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past_due", label: "Past Due" },
  { value: "suspended", label: "Suspended" },
];

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  pending: "neutral",
  scheduled: "neutral",
  expired: "error",
  cancelled: "error",
  past_due: "warning",
  suspended: "warning",
};

// ─── Override Status Modal ─────────────────────────────────────────────────────

function OverrideStatusModal({
  subscription,
  onClose,
}: {
  subscription: IAdminSubscription;
  onClose: () => void;
}) {
  const { overrideStatus } = useAdminSubscriptionsStore();
  const [status, setStatus] = useState(subscription.status);
  const [endDate, setEndDate] = useState(
    subscription.endDate
      ? new Date(subscription.endDate).toISOString().split("T")[0]
      : "",
  );
  const [loading, setLoading] = useState(false);

  const studentName = subscription.student
    ? `${subscription.student.user.firstName} ${subscription.student.user.lastName}`
    : subscription.studentId;

  const handle = async () => {
    setLoading(true);
    await overrideStatus(subscription.id, status, endDate || undefined);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Override Status</p>
        <p className="text-sm text-[#667085] mb-5">
          Update subscription for{" "}
          <span className="font-medium text-[#344054]">{studentName}</span>
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">New Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
            >
              {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">
              End Date <span className="text-[#667085] font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#007FFF] hover:bg-[#0066CC] text-white"
          >
            Save
          </Button>
          <Button onClick={onClose} className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Cancel Confirm Modal ──────────────────────────────────────────────────────

function CancelModal({
  subscription,
  onClose,
}: {
  subscription: IAdminSubscription;
  onClose: () => void;
}) {
  const { cancelSubscription } = useAdminSubscriptionsStore();
  const [loading, setLoading] = useState(false);

  const studentName = subscription.student
    ? `${subscription.student.user.firstName} ${subscription.student.user.lastName}`
    : subscription.studentId;

  const handle = async () => {
    setLoading(true);
    await cancelSubscription(subscription.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Cancel Subscription</p>
        <p className="text-sm text-[#667085] mb-5">
          Cancel the subscription for{" "}
          <span className="font-medium text-[#344054]">{studentName}</span> (
          {subscription.examType?.name ?? "—"},{" "}
          {subscription.plan?.name ?? "—"})? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#D42620] hover:bg-[#b01e19] text-white"
          >
            Cancel Subscription
          </Button>
          <Button onClick={onClose} className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]">
            Go Back
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type ModalState =
  | { type: "override"; subscription: IAdminSubscription }
  | { type: "cancel"; subscription: IAdminSubscription }
  | null;

export default function Subscriptions() {
  const {
    subscriptions, subscriptionsTotal, subscriptionsPage, loadingSubscriptions,
    examTypes, filters,
    setFilters, fetchSubscriptions, fetchExamTypes,
  } = useAdminSubscriptionsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const [searchInput, setSearchInput] = useState("");

  const canWriteSubs = canWrite(AdminModule.SUBSCRIPTIONS);

  useEffect(() => {
    void fetchSubscriptions(1);
    void fetchExamTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setFilters({ search: searchInput });
    void fetchSubscriptions(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") applyFilters();
  };

  const totalPages = Math.ceil(subscriptionsTotal / 20);

  const columns: Column<IAdminSubscription>[] = [
    {
      key: "student",
      header: "Student",
      render: (s) =>
        s.student ? (
          <div>
            <p className="font-medium text-[#101828]">
              {s.student.user.firstName} {s.student.user.lastName}
            </p>
            <p className="text-xs text-[#667085]">{s.student.user.email}</p>
          </div>
        ) : (
          <span className="text-xs text-[#667085]">{s.studentId}</span>
        ),
    },
    {
      key: "examType",
      header: "Exam Type",
      render: (s) => (
        <span className="text-sm text-[#344054]">{s.examType?.name ?? "—"}</span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (s) => (
        <span className="text-sm text-[#344054]">{s.plan?.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <StatusChip
          label={s.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          variant={STATUS_VARIANT[s.status] ?? "neutral"}
        />
      ),
    },
    {
      key: "amountPaid",
      header: "Amount",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          {s.currency} {s.amountPaid.toFixed(2)}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "Expires",
      render: (s) => (
        <span className="text-sm text-[#667085]">
          {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (s) => (
        <span className="text-sm text-[#667085]">
          {new Date(s.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (s) => {
        if (!canWriteSubs) return null;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal({ type: "override", subscription: s })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Override
            </button>
            {s.status !== "cancelled" && (
              <button
                onClick={() => setModal({ type: "cancel", subscription: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section className="xl:px-[2rem] px-[.875rem] py-[1.25rem]">
      {/* Header */}
      <div className="flex mb-6 flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Subscriptions</h1>
          <p className="text-sm text-[#667085] mt-1">
            View and manage student subscriptions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ status: e.target.value });
            void fetchSubscriptions(1);
          }}
          className="px-3 py-2 text-sm border border-[#D0D5DD] rounded-lg outline-none focus:border-[#007FFF] bg-white"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Exam type filter */}
        <select
          value={filters.examTypeId}
          onChange={(e) => {
            setFilters({ examTypeId: e.target.value });
            void fetchSubscriptions(1);
          }}
          className="px-3 py-2 text-sm border border-[#D0D5DD] rounded-lg outline-none focus:border-[#007FFF] bg-white"
        >
          <option value="">All Exam Types</option>
          {examTypes.map((et) => (
            <option key={et.id} value={et.id}>
              {et.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <div className="relative">
          <Icon
            icon="hugeicons:search-01"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] w-4 h-4"
          />
          <input
            type="text"
            placeholder="Search by student name / email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-4 py-2 text-sm border border-[#D0D5DD] rounded-lg outline-none focus:border-[#007FFF] w-72"
          />
        </div>
        <Button onClick={applyFilters} className="bg-[#007FFF] text-white hover:bg-[#0066CC]">
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl flex flex-col" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">All Subscriptions</p>
            <p className="text-sm text-[#667085]">{subscriptionsTotal} total</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={subscriptions}
          loading={loadingSubscriptions}
          keyExtractor={(s) => s.id}
          emptyMessage="No subscriptions found."
          pagination={totalPages > 1}
          metaData={{
            currentPage: subscriptionsPage,
            endPage: totalPages,
            totalRecords: subscriptionsTotal,
            onPageChange: (page) => void fetchSubscriptions(page),
          }}
        />
      </div>

      {/* Modals */}
      {modal?.type === "override" && (
        <OverrideStatusModal
          subscription={modal.subscription}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "cancel" && (
        <CancelModal
          subscription={modal.subscription}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
