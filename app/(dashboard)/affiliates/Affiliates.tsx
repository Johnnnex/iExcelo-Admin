"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useAdminAffiliatesStore } from "@/src/store/affiliates.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminAffiliateListItem, IAffiliatePayout } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">{title}</p>
        <p className="text-sm text-[#667085] mb-5">{message}</p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className={`flex-1 text-white ${confirmClass ?? "bg-[#007FFF] hover:bg-[#0066CC]"}`}
          >
            {confirmLabel}
          </Button>
          <Button onClick={onClose} className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reject Payout Modal ────────────────────────────────────────────────────────

function RejectPayoutModal({
  payout,
  onClose,
}: {
  payout: IAffiliatePayout;
  onClose: () => void;
}) {
  const { rejectPayout } = useAdminAffiliatesStore();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await rejectPayout(payout.id, reason.trim());
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Reject Payout</p>
        <p className="text-sm text-[#667085] mb-5">
          Reject payout of{" "}
          <span className="font-medium text-[#344054]">
            ${payout.amount.toFixed(2)}
          </span>
          ? Provide a reason for the affiliate.
        </p>
        <InputField
          label="Rejection Reason"
          placeholder="e.g. Incorrect payment details"
          value={reason}
          onChange={(e) => setReason((e.target as HTMLInputElement).value)}
        />
        <div className="flex gap-3 mt-5">
          <Button
            onClick={handle}
            loading={loading}
            disabled={!reason.trim()}
            className="flex-1 bg-[#D42620] hover:bg-[#b01e19] text-white"
          >
            Reject
          </Button>
          <Button onClick={onClose} className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Payouts Panel ─────────────────────────────────────────────────────────────

function PayoutsPanel({
  affiliate,
  canWriteAffiliates,
  onClose,
}: {
  affiliate: IAdminAffiliateListItem;
  canWriteAffiliates: boolean;
  onClose: () => void;
}) {
  const { payouts, payoutsTotal, loadingPayouts, fetchPayouts, approvePayout } =
    useAdminAffiliatesStore();
  const [rejectPayout, setRejectPayout] = useState<IAffiliatePayout | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchPayouts(affiliate.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliate.id]);

  const handleApprove = async (payout: IAffiliatePayout) => {
    setApprovingId(payout.id);
    await approvePayout(payout.id);
    setApprovingId(null);
  };

  const statusVariant = (status: IAffiliatePayout["status"]) => {
    if (status === "completed") return "success";
    if (status === "failed") return "error";
    if (status === "processing") return "warning";
    return "neutral";
  };

  const name = `${affiliate.user.firstName} ${affiliate.user.lastName}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Payouts — {name}</p>
            <p className="text-xs text-[#667085]">
              Code: {affiliate.affiliateCode} · {payoutsTotal} payout{payoutsTotal !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F2F4F7] transition-colors"
          >
            <Icon icon="hugeicons:cancel-01" className="w-5 h-5 text-[#667085]" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-[#F0F2F5]">
          {[
            { label: "Total Earnings", value: `$${affiliate.totalEarnings.toFixed(2)}` },
            { label: "Pending", value: `$${affiliate.pendingBalance.toFixed(2)}` },
            { label: "Paid Out", value: `$${affiliate.totalPaidOut.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F9FAFB] rounded-xl p-3">
              <p className="text-xs text-[#667085]">{label}</p>
              <p className="font-semibold text-[#101828] mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Payout list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingPayouts ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[#F0F2F5] animate-pulse" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Icon icon="hugeicons:invoice-01" className="w-10 h-10 text-[#D0D5DD] mb-3" />
              <p className="text-sm text-[#667085]">No payouts requested yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="border border-[#F0F2F5] rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#101828]">
                        ${p.amount.toFixed(2)}
                      </span>
                      <StatusChip
                        label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        variant={statusVariant(p.status)}
                      />
                    </div>
                    <p className="text-xs text-[#667085]">
                      Requested {new Date(p.createdAt).toLocaleDateString()}
                      {p.paymentMethod && ` · ${p.paymentMethod}`}
                    </p>
                    {p.failureReason && (
                      <p className="text-xs text-[#D42620] mt-0.5">
                        Rejected: {p.failureReason}
                      </p>
                    )}
                  </div>
                  {p.status === "pending" && canWriteAffiliates && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={approvingId === p.id}
                        onClick={() => void handleApprove(p)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] disabled:opacity-50 transition-colors"
                      >
                        {approvingId === p.id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => setRejectPayout(p)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {rejectPayout && (
        <RejectPayoutModal
          payout={rejectPayout}
          onClose={() => setRejectPayout(null)}
        />
      )}
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type ModalState =
  | { type: "deactivate"; affiliate: IAdminAffiliateListItem }
  | { type: "reactivate"; affiliate: IAdminAffiliateListItem }
  | null;

export default function Affiliates() {
  const {
    affiliates, affiliatesTotal, affiliatesPage, loadingAffiliates,
    searchTerm, setSearchTerm,
    fetchAffiliates, deactivateAffiliate, reactivateAffiliate,
  } = useAdminAffiliatesStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const [payoutsAffiliate, setPayoutsAffiliate] = useState<IAdminAffiliateListItem | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const canWriteAffiliates = canWrite(AdminModule.AFFILIATES);

  useEffect(() => {
    void fetchAffiliates(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput);
    void fetchAffiliates(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = Math.ceil(affiliatesTotal / 20);

  const columns: Column<IAdminAffiliateListItem>[] = [
    {
      key: "name",
      header: "Affiliate",
      render: (a) => (
        <div>
          <p className="font-medium text-[#101828]">
            {a.user.firstName} {a.user.lastName}
          </p>
          <p className="text-xs text-[#667085]">{a.user.email}</p>
        </div>
      ),
    },
    {
      key: "affiliateCode",
      header: "Code",
      render: (a) => (
        <span className="font-mono text-xs bg-[#F2F4F7] px-2 py-1 rounded-md text-[#344054]">
          {a.affiliateCode}
        </span>
      ),
    },
    {
      key: "totalReferrals",
      header: "Referrals",
      render: (a) => (
        <span className="text-sm text-[#344054]">{a.totalReferrals}</span>
      ),
    },
    {
      key: "totalEarnings",
      header: "Earnings",
      render: (a) => (
        <span className="text-sm text-[#344054]">${a.totalEarnings.toFixed(2)}</span>
      ),
    },
    {
      key: "pendingBalance",
      header: "Pending",
      render: (a) => (
        <span className="text-sm text-[#F3A218]">${a.pendingBalance.toFixed(2)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) =>
        a.user.isActive ? (
          <StatusChip label="Active" variant="success" />
        ) : (
          <StatusChip label="Inactive" variant="error" />
        ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (a) => (
        <span className="text-sm text-[#667085]">
          {new Date(a.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (a) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPayoutsAffiliate(a)}
            className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
          >
            Payouts
          </button>
          {canWriteAffiliates && (
            <>
              {a.user.isActive ? (
                <button
                  onClick={() => setModal({ type: "deactivate", affiliate: a })}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => setModal({ type: "reactivate", affiliate: a })}
                  className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors"
                >
                  Reactivate
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="xl:px-[2rem] px-[.875rem] py-[1.25rem]">
      {/* Header */}
      <div className="flex mb-6 flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Affiliates</h1>
          <p className="text-sm text-[#667085] mt-1">
            Manage affiliate accounts and payout requests
          </p>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Icon
              icon="hugeicons:search-01"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] w-4 h-4"
            />
            <input
              type="text"
              placeholder="Search affiliates..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-4 py-2 text-sm border border-[#D0D5DD] rounded-lg outline-none focus:border-[#007FFF] w-64"
            />
          </div>
          <Button onClick={handleSearch} className="bg-[#007FFF] text-white hover:bg-[#0066CC]">
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl flex flex-col" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">All Affiliates</p>
            <p className="text-sm text-[#667085]">{affiliatesTotal} total</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={affiliates}
          loading={loadingAffiliates}
          keyExtractor={(a) => a.id}
          emptyMessage="No affiliates yet. They will appear here once they register."
          pagination={totalPages > 1}
          metaData={{
            currentPage: affiliatesPage,
            endPage: totalPages,
            totalRecords: affiliatesTotal,
            onPageChange: (page) => void fetchAffiliates(page),
          }}
        />
      </div>

      {/* Payouts panel */}
      {payoutsAffiliate && (
        <PayoutsPanel
          affiliate={payoutsAffiliate}
          canWriteAffiliates={canWriteAffiliates}
          onClose={() => setPayoutsAffiliate(null)}
        />
      )}

      {/* Modals */}
      {modal?.type === "deactivate" && (
        <ConfirmModal
          title="Deactivate Affiliate"
          message={`Deactivate ${modal.affiliate.user.firstName} ${modal.affiliate.user.lastName}? They will not be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="bg-[#D42620] hover:bg-[#b01e19]"
          onConfirm={() => deactivateAffiliate(modal.affiliate.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reactivate" && (
        <ConfirmModal
          title="Reactivate Affiliate"
          message={`Reactivate ${modal.affiliate.user.firstName} ${modal.affiliate.user.lastName}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          confirmClass="bg-[#099137] hover:bg-[#036B26]"
          onConfirm={() => reactivateAffiliate(modal.affiliate.userId)}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
