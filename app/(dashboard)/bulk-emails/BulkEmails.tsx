"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAdminBulkEmailsStore } from "@/src/store/bulk-emails.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import {
  AdminModule,
  IAdminCampaign,
  CampaignTargetAudience,
  CampaignStatus,
} from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCE_OPTIONS: { value: CampaignTargetAudience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "students", label: "Students" },
  { value: "sponsors", label: "Sponsors" },
  { value: "affiliates", label: "Affiliates" },
];

const STATUS_VARIANT: Record<CampaignStatus, "success" | "warning" | "neutral" | "error"> = {
  draft: "neutral",
  queued: "warning",
  sent: "success",
  failed: "error",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
};

// ─── Edit Modal (TipTap editor inline) ────────────────────────────────────────

function EditModal({
  item,
  onClose,
}: {
  item: IAdminCampaign;
  onClose: () => void;
}) {
  const { updateCampaign, savingCampaign } = useAdminBulkEmailsStore();
  const [name, setName] = useState(item.name);
  const [subject, setSubject] = useState(item.subject);
  const [audience, setAudience] = useState<CampaignTargetAudience>(item.targetAudience);
  const [content, setContent] = useState(item.content);

  const handle = async () => {
    const ok = await updateCampaign(item.id, { name, subject, targetAudience: audience, content });
    if (ok) onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-2xl">
      <div className="flex items-center justify-between p-6 border-b border-[#E4E7EC]">
        <p className="font-semibold text-[#101828]">Edit Campaign</p>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F2F4F7]">
          <Icon icon="hugeicons:cancel-01" className="w-5 h-5 text-[#667085]" />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <InputField
          label="Campaign Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. January Newsletter"
        />
        <InputField
          label="Email Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Get ready for your exams!"
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#344054]">Target Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as CampaignTargetAudience)}
            className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
          >
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <InputField
          label="Email Body"
          type="rich-text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          richTextProps={{ maxHeight: "300px" }}
        />
      </div>

      <div className="flex gap-3 p-6 border-t border-[#E4E7EC]">
        <Button
          onClick={handle}
          loading={savingCampaign}
          className="flex-1 bg-[#007FFF]! hover:bg-[#0066CC]! text-white!"
        >
          Save Changes
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 bg-[#F2F4F7]! text-[#344054]! hover:bg-[#E4E7EC]!"
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({
  item,
  onClose,
}: {
  item: IAdminCampaign;
  onClose: () => void;
}) {
  const { deleteCampaign } = useAdminBulkEmailsStore();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await deleteCampaign(item.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Delete Campaign</p>
        <p className="text-sm text-[#667085] mb-5">
          Delete{" "}
          <span className="font-medium text-[#344054]">&quot;{item.name}&quot;</span>? This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#D42620]! hover:bg-[#b01e19]! text-white!"
          >
            Delete
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7]! text-[#344054]! hover:bg-[#E4E7EC]!"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Send Modal ────────────────────────────────────────────────────────────────

function SendModal({
  item,
  onClose,
}: {
  item: IAdminCampaign;
  onClose: () => void;
}) {
  const { sendCampaign } = useAdminBulkEmailsStore();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await sendCampaign(item.id);
    setLoading(false);
    onClose();
  };

  const audienceLabel =
    AUDIENCE_OPTIONS.find((o) => o.value === item.targetAudience)?.label ?? item.targetAudience;

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Send Campaign</p>
        <p className="text-sm text-[#667085] mb-5">
          Send{" "}
          <span className="font-medium text-[#344054]">&quot;{item.name}&quot;</span> to{" "}
          <span className="font-medium text-[#344054]">{audienceLabel}</span>? This cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#007FFF]! hover:bg-[#0066CC]! text-white!"
          >
            Send Now
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7]! text-[#344054]! hover:bg-[#E4E7EC]!"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type ModalState =
  | { type: "edit"; item: IAdminCampaign }
  | { type: "delete"; item: IAdminCampaign }
  | { type: "send"; item: IAdminCampaign }
  | null;

export default function BulkEmails() {
  const router = useRouter();
  const { campaigns, loadingCampaigns, fetchCampaigns } = useAdminBulkEmailsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);

  const canWriteCampaigns = canWrite(AdminModule.BULK_EMAILS);

  useEffect(() => {
    void fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = campaigns.filter(
    (c) =>
      !searchApplied ||
      c.name.toLowerCase().includes(searchApplied.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchApplied.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: Column<IAdminCampaign>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => (
        <div>
          <p className="font-medium text-[#101828]">{c.name}</p>
          <p className="text-xs text-[#667085]">{c.subject}</p>
        </div>
      ),
    },
    {
      key: "targetAudience",
      header: "Audience",
      render: (c) => (
        <span className="text-sm text-[#344054]">
          {AUDIENCE_OPTIONS.find((o) => o.value === c.targetAudience)?.label ?? c.targetAudience}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusChip label={STATUS_LABEL[c.status]} variant={STATUS_VARIANT[c.status]} />
      ),
    },
    {
      key: "recipientCount",
      header: "Recipients",
      render: (c) => (
        <span className="text-sm text-[#344054]">
          {c.status === "draft" ? "—" : c.recipientCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "sentAt",
      header: "Sent",
      render: (c) => (
        <span className="text-sm text-[#667085]">
          {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (c) => (
        <span className="text-sm text-[#667085]">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex items-center gap-2">
          {canWriteCampaigns && c.status === "draft" && (
            <>
              <button
                onClick={() => setModal({ type: "send", item: c })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors"
              >
                Send
              </button>
              <button
                onClick={() => setModal({ type: "edit", item: c })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setModal({ type: "delete", item: c })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
              >
                Delete
              </button>
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
          <h1 className="text-2xl font-bold text-[#101828]">Bulk Emails</h1>
          <p className="text-sm text-[#667085] mt-1">
            Create and send email campaigns to your users
          </p>
        </div>
        {canWriteCampaigns && (
          <Button
            onClick={() => router.push("/bulk-emails/new")}
            className="bg-[#007FFF]! text-white! hover:bg-[#0066CC]! shrink-0"
          >
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
            New Campaign
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl flex flex-col" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">All Campaigns</p>
            <p className="text-sm text-[#667085]">
              {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paged}
          loading={loadingCampaigns}
          keyExtractor={(c) => c.id}
          emptyMessage="No campaigns yet. Create one to get started."
          shouldNotHaveBorder
          searchProps={{
            value: search,
            onChange: setSearch,
            onSearch: () => { setSearchApplied(search); setPage(1); },
            placeholder: "Search campaigns...",
          }}
          pagination
          metaData={{
            currentPage: (page - 1) * PAGE_SIZE + 1,
            endPage: filtered.length > page * PAGE_SIZE ? page * PAGE_SIZE + 1 : (page - 1) * PAGE_SIZE + 1,
            totalRecords: filtered.length,
            onPageChange: (skip) => setPage(Math.floor(skip / PAGE_SIZE) + 1),
          }}
        />
      </div>

      {modal?.type === "edit" && (
        <EditModal item={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal item={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === "send" && (
        <SendModal item={modal.item} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
