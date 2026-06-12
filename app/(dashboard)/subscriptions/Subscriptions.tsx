"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAdminSubscriptionsStore } from "@/src/store/subscriptions.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import {
  AdminModule,
  IAdminSubscription,
  IAdminSubscriptionPlan,
} from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

const TABS = ["Student Subs", "Sponsor Subs", "Plans"] as const;
type Tab = (typeof TABS)[number];

const STATUS_VARIANT: Record<string, "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  pending: "neutral",
  scheduled: "neutral",
  expired: "error",
  cancelled: "error",
  past_due: "warning",
  suspended: "warning",
};

function fmtStatus(s: string) {
  return s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({
  subscription,
  type,
  onClose,
}: {
  subscription: IAdminSubscription;
  type: "student" | "sponsor";
  onClose: () => void;
}) {
  const { cancelSubscription } = useAdminSubscriptionsStore();
  const [loading, setLoading] = useState(false);

  const studentName = subscription.student
    ? `${subscription.student.user.firstName} ${subscription.student.user.lastName}`
    : subscription.studentId;

  const handle = async () => {
    setLoading(true);
    await cancelSubscription(subscription.id, type);
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
          {subscription.examType?.name ?? "—"}, {subscription.plan?.name ?? "—"}
          )? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#D42620]! hover:bg-[#b01e19]! text-white!"
          >
            Cancel Subscription
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7]! text-[#344054]! hover:bg-[#E4E7EC]!"
          >
            Go Back
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Plan Form Modal ───────────────────────────────────────────────────────────

function PlanFormModal({
  plan,
  examTypes,
  onClose,
}: {
  plan: IAdminSubscriptionPlan | null;
  examTypes: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { createPlan, updatePlan } = useAdminSubscriptionsStore();
  const isEdit = plan !== null;

  const [form, setForm] = useState({
    examTypeId: plan?.examTypeId ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    durationDays: plan?.durationDays ?? 30,
    sortOrder: plan?.sortOrder ?? 0,
    stripeProductId: plan?.stripeProductId ?? "",
    isActive: plan?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.examTypeId || !form.name || !form.durationDays) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updatePlan(plan.id, {
          name: form.name,
          description: form.description || undefined,
          durationDays: Number(form.durationDays),
          sortOrder: Number(form.sortOrder),
          stripeProductId: form.stripeProductId || undefined,
          isActive: form.isActive,
        });
      } else {
        await createPlan({
          examTypeId: form.examTypeId,
          name: form.name,
          description: form.description || undefined,
          durationDays: Number(form.durationDays),
          sortOrder: Number(form.sortOrder),
          stripeProductId: form.stripeProductId || undefined,
        });
      }
      onClose();
    } catch {
      // error toasted in store
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-md">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">
          {isEdit ? "Edit Plan" : "New Plan"}
        </p>
        <p className="text-sm text-[#667085] mb-5">
          {isEdit ? "Update subscription plan details." : "Create a new subscription plan."}
        </p>

        <div className="flex flex-col gap-4">
          {/* Exam Type — only on create */}
          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#344054]">Exam Type</label>
              <select
                value={form.examTypeId}
                onChange={(e) => setField("examTypeId", e.target.value)}
                className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
              >
                <option value="">Select exam type…</option>
                {examTypes.map((et) => (
                  <option key={et.id} value={et.id}>{et.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Monthly Plan"
              className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">
              Description <span className="text-[#667085] font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#344054]">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) => setField("durationDays", Number(e.target.value))}
                className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#344054]">Sort Order</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", Number(e.target.value))}
                className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">
              Stripe Product ID <span className="text-[#667085] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.stripeProductId}
              onChange={(e) => setField("stripeProductId", e.target.value)}
              placeholder="prod_…"
              className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="w-4 h-4 accent-[#007FFF]"
              />
              <span className="text-sm text-[#344054]">Active</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <Button
            onClick={handle}
            loading={saving}
            className="flex-1 bg-[#007FFF]! hover:bg-[#0066CC]! text-white!"
          >
            {isEdit ? "Save Changes" : "Create Plan"}
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

// ─── Delete Plan Modal ─────────────────────────────────────────────────────────

function DeletePlanModal({
  plan,
  onClose,
}: {
  plan: IAdminSubscriptionPlan;
  onClose: () => void;
}) {
  const { deletePlan } = useAdminSubscriptionsStore();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await deletePlan(plan.id);
      onClose();
    } catch {
      // error toasted in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Delete Plan</p>
        <p className="text-sm text-[#667085] mb-5">
          Delete <span className="font-medium text-[#344054]">{plan.name}</span>? This
          cannot be undone and may affect active subscriptions.
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

// ─── Subs Table Tab ────────────────────────────────────────────────────────────

function SubsTab({
  tabType,
  canWrite,
}: {
  tabType: "student" | "sponsor";
  canWrite: boolean;
}) {
  const store = useAdminSubscriptionsStore();

  const isStudent = tabType === "student";
  const tabState = isStudent ? store.studentSubs : store.sponsorSubs;
  const setSearch = isStudent ? store.setStudentSearch : store.setSponsorSearch;
  const fetchSubs = isStudent ? store.fetchStudentSubs : store.fetchSponsorSubs;

  const [modal, setModal] = useState<{
    type: "cancel";
    subscription: IAdminSubscription;
  } | null>(null);

  useEffect(() => {
    if (tabState.items.length === 0) void fetchSubs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { items, cursorPage, hasMore, loading, searchTerm } = tabState;
  const endPage = hasMore ? cursorPage + 1 : cursorPage;

  const columns: Column<IAdminSubscription>[] = [
    {
      key: "student",
      header: "Student",
      render: (s) =>
        s.student ? (
          <div>
            <p className="font-medium text-[#101828] text-sm">
              {s.student.user.firstName} {s.student.user.lastName}
            </p>
            <p className="text-xs text-[#667085]">{s.student.user.email}</p>
          </div>
        ) : (
          <span className="text-xs text-[#667085]">{s.studentId}</span>
        ),
    },
    ...(isStudent
      ? []
      : [
          {
            key: "sponsor" as keyof IAdminSubscription,
            header: "Sponsor",
            render: (s: IAdminSubscription) =>
              s.sponsor ? (
                <div>
                  <p className="font-medium text-[#101828] text-sm">
                    {s.sponsor.companyName ??
                      `${s.sponsor.user.firstName} ${s.sponsor.user.lastName}`}
                  </p>
                  <p className="text-xs text-[#667085]">{s.sponsor.user.email}</p>
                </div>
              ) : (
                <span className="text-xs text-[#667085]">—</span>
              ),
          } as Column<IAdminSubscription>,
        ]),
    {
      key: "examType",
      header: "Exam",
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
          label={fmtStatus(s.status)}
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
        if (!canWrite) return null;
        return (
          <div className="flex items-center gap-2">
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
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          keyExtractor={(s) => s.id}
          emptyMessage="No subscriptions found."
          shouldNotHaveBorder
          searchProps={{
            value: searchTerm,
            onChange: setSearch,
            onSearch: () => void fetchSubs(1),
            placeholder: "Search by name or email…",
          }}
          pagination
          metaData={{
            currentPage: cursorPage,
            endPage,
            totalRecords: items.length,
            onPageChange: (p) => {
              if (p < cursorPage && cursorPage > 1) void fetchSubs(cursorPage - 1);
              else if (p > cursorPage && hasMore) void fetchSubs(cursorPage + 1);
            },
          }}
        />
      </div>

      {modal?.type === "cancel" && (
        <CancelModal
          subscription={modal.subscription}
          type={tabType}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── Plans Tab ─────────────────────────────────────────────────────────────────

const PLANS_PAGE_SIZE = 20;

function PlansTab({ canWrite }: { canWrite: boolean }) {
  const { plans, loadingPlans, fetchPlans } = useAdminSubscriptionsStore();

  const [modal, setModal] = useState<
    | { type: "create" }
    | { type: "edit"; plan: IAdminSubscriptionPlan }
    | { type: "delete"; plan: IAdminSubscriptionPlan }
    | null
  >(null);

  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (plans.length === 0) void fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (!searchApplied) return true;
    const q = searchApplied.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.examType?.name ?? "").toLowerCase().includes(q);
  });
  const pagedPlans = filteredPlans.slice((page - 1) * PLANS_PAGE_SIZE, page * PLANS_PAGE_SIZE);

  // Derive unique exam types from loaded plans for the form
  const examTypes = Array.from(
    new Map(
      plans
        .filter((p) => p.examType)
        .map((p) => [p.examTypeId, { id: p.examTypeId, name: p.examType!.name }]),
    ).values(),
  );

  const columns: Column<IAdminSubscriptionPlan>[] = [
    {
      key: "name",
      header: "Plan Name",
      render: (p) => (
        <div>
          <p className="font-medium text-[#101828] text-sm">{p.name}</p>
          {p.description && (
            <p className="text-xs text-[#667085] mt-0.5 line-clamp-1">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "examType",
      header: "Exam Type",
      render: (p) => (
        <span className="text-sm text-[#344054]">{p.examType?.name ?? "—"}</span>
      ),
    },
    {
      key: "durationDays",
      header: "Duration",
      render: (p) => (
        <span className="text-sm text-[#344054]">{p.durationDays} days</span>
      ),
    },
    {
      key: "sortOrder",
      header: "Order",
      render: (p) => <span className="text-sm text-[#667085]">{p.sortOrder}</span>,
    },
    {
      key: "isActive",
      header: "Status",
      render: (p) => (
        <StatusChip
          label={p.isActive ? "Active" : "Inactive"}
          variant={p.isActive ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "stripeProductId",
      header: "Stripe ID",
      render: (p) => (
        <span className="text-xs text-[#667085] font-mono">
          {p.stripeProductId ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (p) => {
        if (!canWrite) return null;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal({ type: "edit", plan: p })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setModal({ type: "delete", plan: p })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Subscription Plans</p>
            <p className="text-sm text-[#667085]">{filteredPlans.length} plan{filteredPlans.length !== 1 ? "s" : ""}</p>
          </div>
          {canWrite && (
            <Button
              onClick={() => setModal({ type: "create" })}
              className="bg-[#007FFF]! hover:bg-[#0066CC]! text-white! text-sm!"
            >
              + New Plan
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={pagedPlans}
          loading={loadingPlans}
          keyExtractor={(p) => p.id}
          emptyMessage="No plans found."
          shouldNotHaveBorder
          searchProps={{
            value: search,
            onChange: setSearch,
            onSearch: () => { setSearchApplied(search); setPage(1); },
            placeholder: "Search plans...",
          }}
          pagination
          metaData={{
            currentPage: (page - 1) * PLANS_PAGE_SIZE + 1,
            endPage: filteredPlans.length > page * PLANS_PAGE_SIZE ? page * PLANS_PAGE_SIZE + 1 : (page - 1) * PLANS_PAGE_SIZE + 1,
            totalRecords: filteredPlans.length,
            onPageChange: (skip) => setPage(Math.floor(skip / PLANS_PAGE_SIZE) + 1),
          }}
        />
      </div>

      {modal?.type === "create" && (
        <PlanFormModal
          plan={null}
          examTypes={examTypes}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && (
        <PlanFormModal
          plan={modal.plan}
          examTypes={examTypes}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeletePlanModal plan={modal.plan} onClose={() => setModal(null)} />
      )}
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Subscriptions() {
  const { canWrite } = useAdminAuthStore();
  const canWriteSubs = canWrite(AdminModule.SUBSCRIPTIONS);

  const [activeTab, setActiveTab] = useState<Tab>("Student Subs");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 4, width: 80 });

  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.indexOf(activeTab)];
    if (el) setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  return (
    <section className="xl:px-[2rem] px-[.875rem] py-[1.25rem] flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-[600] text-[#171717]">Subscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage student subscriptions, sponsor-funded subs, and plans
        </p>
      </div>

      {/* Animated pill tabs */}
      <div>
        <div className="relative flex bg-[#F9FAFB] p-1 rounded-xl w-fit border border-[#F0F2F5]">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm"
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              transition:
                "left 300ms cubic-bezier(0.34, 1.56, 0.64, 1), width 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
          {TABS.map((tab, i) => (
            <button
              key={tab}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab)}
              className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === tab
                  ? "text-[#101828]"
                  : "text-[#667085] hover:text-[#344054]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Student Subs" && (
        <SubsTab tabType="student" canWrite={canWriteSubs} />
      )}
      {activeTab === "Sponsor Subs" && (
        <SubsTab tabType="sponsor" canWrite={canWriteSubs} />
      )}
      {activeTab === "Plans" && <PlansTab canWrite={canWriteSubs} />}
    </section>
  );
}

