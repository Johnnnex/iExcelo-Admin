"use client";

import { useEffect, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
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

// ─── Main component ────────────────────────────────────────────────────────────

type ModalState =
  | { type: "deactivate"; sponsor: IAdminSponsorListItem }
  | { type: "reactivate"; sponsor: IAdminSponsorListItem }
  | null;

const SPONSOR_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  company: "Company",
  religious: "Religious",
  government: "Government",
};

export default function Sponsors() {
  const {
    sponsors, sponsorsTotal, sponsorsPage, loadingSponsors,
    searchTerm, setSearchTerm,
    fetchSponsors, deactivateSponsor, reactivateSponsor,
  } = useAdminSponsorsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const [searchInput, setSearchInput] = useState("");

  const canWriteSponsors = canWrite(AdminModule.SPONSORS);

  useEffect(() => {
    void fetchSponsors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput);
    void fetchSponsors(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = Math.ceil(sponsorsTotal / 20);

  const columns: Column<IAdminSponsorListItem>[] = [
    {
      key: "name",
      header: "Sponsor",
      render: (s) => (
        <div>
          <p className="font-medium text-[#101828]">
            {s.companyName ?? `${s.user.firstName} ${s.user.lastName}`}
          </p>
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
        <span className="text-sm text-[#344054]">{s.totalStudentsSponsored}</span>
      ),
    },
    {
      key: "totalAmountDonated",
      header: "Total Donated",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          ${s.totalAmountDonated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          <div className="flex items-center gap-2">
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
    <section className="xl:px-[2rem] px-[.875rem] py-[1.25rem]">
      {/* Header */}
      <div className="flex mb-6 flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Sponsors</h1>
          <p className="text-sm text-[#667085] mt-1">
            Manage sponsor accounts and activity
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
              placeholder="Search sponsors..."
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
            <p className="font-semibold text-[#101828]">All Sponsors</p>
            <p className="text-sm text-[#667085]">{sponsorsTotal} total</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={sponsors}
          loading={loadingSponsors}
          keyExtractor={(s) => s.id}
          emptyMessage="No sponsors yet. They will appear here once they register."
          pagination={totalPages > 1}
          metaData={{
            currentPage: sponsorsPage,
            endPage: totalPages,
            totalRecords: sponsorsTotal,
            onPageChange: (page) => void fetchSponsors(page),
          }}
        />
      </div>

      {/* Modals */}
      {modal?.type === "deactivate" && (
        <ConfirmModal
          title="Deactivate Sponsor"
          message={`Deactivate ${modal.sponsor.companyName ?? `${modal.sponsor.user.firstName} ${modal.sponsor.user.lastName}`}? They will not be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="bg-[#D42620] hover:bg-[#b01e19]"
          onConfirm={() => deactivateSponsor(modal.sponsor.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reactivate" && (
        <ConfirmModal
          title="Reactivate Sponsor"
          message={`Reactivate ${modal.sponsor.companyName ?? `${modal.sponsor.user.firstName} ${modal.sponsor.user.lastName}`}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          confirmClass="bg-[#099137] hover:bg-[#036B26]"
          onConfirm={() => reactivateSponsor(modal.sponsor.userId)}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
