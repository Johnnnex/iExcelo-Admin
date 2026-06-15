"use client";

import { useEffect, useState } from "react";
import { useAdminSponsorsStore } from "@/src/store/sponsors.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminSponsorListItem } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
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
            className={`flex-1 text-white ${confirmClass ?? "bg-[#007FFF]!"}`}
          >
            {confirmLabel}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7]! text-[#344054]!"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const SPONSOR_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  company: "Company",
  religious: "Religious",
  government: "Government",
};

type ModalState =
  | { type: "reset-link"; sponsor: IAdminSponsorListItem }
  | { type: "deactivate"; sponsor: IAdminSponsorListItem }
  | { type: "reactivate"; sponsor: IAdminSponsorListItem }
  | null;

export default function Sponsors() {
  const {
    sponsors,
    cursors,
    cursorPage,
    hasMore,
    loadingSponsors,
    searchTerm,
    setSearchTerm,
    fetchSponsors,
    sendResetLink,
    deactivateSponsor,
    reactivateSponsor,
  } = useAdminSponsorsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const canWriteSponsors = canWrite(AdminModule.SPONSORS);

  useEffect(() => {
    void fetchSponsors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endPage = hasMore ? cursorPage + 1 : cursorPage;
  const prevPage = cursorPage > 1 ? cursorPage - 1 : null;

  const sponsorName = (s: IAdminSponsorListItem) =>
    s.companyName ?? `${s.user.firstName} ${s.user.lastName}`;

  const columns: Column<IAdminSponsorListItem>[] = [
    {
      key: "name",
      header: "Sponsor",
      render: (s) => (
        <div>
          <p className="font-medium text-[#101828]">{sponsorName(s)}</p>
          <p className="text-xs text-[#667085]">{s.user.email}</p>
        </div>
      ),
    },
    {
      key: "sponsorType",
      header: "Type",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          {SPONSOR_TYPE_LABELS[s.sponsorType] ?? s.sponsorType}
        </span>
      ),
    },
    {
      key: "totalStudentsSponsored",
      header: "Students",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          {s.totalStudentsSponsored}
        </span>
      ),
    },
    {
      key: "totalAmountDonated",
      header: "Total Donated",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          $
          {s.totalAmountDonated.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) =>
        s.user.isActive ? (
          <StatusChip label="Active" variant="success" />
        ) : (
          <StatusChip label="Inactive" variant="error" />
        ),
    },
    {
      key: "createdAt",
      header: "Joined",
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
        if (!canWriteSponsors) return null;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setModal({ type: "reset-link", sponsor: s })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors whitespace-nowrap"
            >
              Send Reset Link
            </button>
            {s.user.isActive ? (
              <button
                onClick={() => setModal({ type: "deactivate", sponsor: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => setModal({ type: "reactivate", sponsor: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors"
              >
                Reactivate
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Sponsors</h1>
        <p className="text-sm text-[#667085] mt-1">
          Manage sponsor accounts and activity
        </p>
      </div>

      <div
        className="bg-white overflow-hidden rounded-2xl"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="px-6 py-4 border-b border-[#F0F2F5]">
          <p className="font-semibold text-[#101828]">All Sponsors</p>
        </div>

        <DataTable
          columns={columns}
          data={sponsors}
          loading={loadingSponsors}
          keyExtractor={(s) => s.id}
          emptyMessage="No sponsors yet."
          shouldNotHaveBorder
          searchProps={{
            value: searchTerm,
            onChange: setSearchTerm,
            onSearch: () => void fetchSponsors(1),
            placeholder: "Search by name, company or email...",
          }}
          pagination
          metaData={{
            currentPage: cursorPage,
            endPage,
            totalRecords: sponsors.length,
            onPageChange: (p) => {
              if (p < cursorPage && prevPage !== null)
                void fetchSponsors(prevPage);
              else if (p > cursorPage && hasMore)
                void fetchSponsors(cursorPage + 1);
            },
          }}
        />
      </div>

      {modal?.type === "reset-link" && (
        <ConfirmModal
          title="Send Password Reset Link"
          message={`Send a password reset email to ${sponsorName(modal.sponsor)} (${modal.sponsor.user.email})?`}
          confirmLabel="Send Reset Link"
          onConfirm={() => sendResetLink(modal.sponsor.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "deactivate" && (
        <ConfirmModal
          title="Deactivate Sponsor"
          message={`Deactivate ${sponsorName(modal.sponsor)}? They will not be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="!bg-[#D42620]"
          onConfirm={() => deactivateSponsor(modal.sponsor.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reactivate" && (
        <ConfirmModal
          title="Reactivate Sponsor"
          message={`Reactivate ${sponsorName(modal.sponsor)}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          confirmClass="!bg-[#099137]"
          onConfirm={() => reactivateSponsor(modal.sponsor.userId)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
