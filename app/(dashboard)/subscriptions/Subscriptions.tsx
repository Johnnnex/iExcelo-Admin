"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAdminSubscriptionsStore } from "@/src/store/subscriptions.store";
import { useExamRevisionStore } from "@/src/store/exam-revision.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { Icon } from "@iconify/react";
import {
  AdminModule,
  IAdminSubscription,
  IAdminSubscriptionPlan,
  IRegionCurrency,
} from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import {
  planDrawerSchema,
  PlanDrawerValues,
} from "@/src/schemas/subscriptions.schema";
import { CARD_SHADOW } from "@/src/utils";

const TABS = [
  "Student Subs",
  "Sponsor Subs",
  "Plans",
  "Region Config",
] as const;
type Tab = (typeof TABS)[number];

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "error" | "neutral"
> = {
  active: "success",
  pending: "neutral",
  scheduled: "neutral",
  expired: "error",
  cancelled: "error",
  past_due: "warning",
  suspended: "warning",
};

const ALL_CURRENCIES = [
  { value: "NGN", label: "₦ NGN — Nigerian Naira" },
  { value: "USD", label: "$ USD — US Dollar" },
  { value: "GBP", label: "£ GBP — British Pound" },
  { value: "EUR", label: "€ EUR — Euro" },
  { value: "CAD", label: "CA$ CAD — Canadian Dollar" },
  { value: "AUD", label: "A$ AUD — Australian Dollar" },
  { value: "GHS", label: "₵ GHS — Ghanaian Cedi" },
  { value: "GMD", label: "D GMD — Gambian Dalasi" },
];

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
  { value: "GHS", label: "GHS — Ghanaian Cedi" },
  { value: "GMD", label: "GMD — Gambian Dalasi" },
];

const PROVIDER_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paystack", label: "Paystack" },
];

function fmtStatus(s: string) {
  return s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function TabCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white overflow-hidden rounded-2xl flex flex-col"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
        <div>
          <p className="font-semibold text-[#101828]">{title}</p>
          {subtitle && <p className="text-sm text-[#667085]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Spinner helper ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  );
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

// ─── Plan Drawer ───────────────────────────────────────────────────────────────

function PlanDrawer({
  plan,
  onClose,
}: {
  plan: IAdminSubscriptionPlan | null;
  onClose: () => void;
}) {
  const { createPlan, updatePlan } = useAdminSubscriptionsStore();
  const { examTypes, fetchExamTypes } = useExamRevisionStore();
  const isEdit = plan !== null;

  useEffect(() => {
    if (examTypes.length === 0) fetchExamTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialPrices =
    plan?.prices?.map((p) => ({
      currency: p.currency,
      amount: p.amount,
      stripePriceId: p.stripePriceId ?? "",
      paystackPlanCode: p.paystackPlanCode ?? "",
    })) ?? [];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanDrawerValues>({
    resolver: yupResolver(planDrawerSchema),
    defaultValues: {
      examTypeId: plan?.examTypeId ?? "",
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      durationDays: plan?.durationDays ?? 30,
      sortOrder: plan?.sortOrder ?? 0,
      stripeProductId: plan?.stripeProductId ?? "",
      prices: initialPrices,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prices" });
  const watchedPrices = watch("prices");
  const usedCurrencies = (watchedPrices ?? []).map((p) => p.currency);
  const availableCurrencies = ALL_CURRENCIES.filter(
    (c) => !usedCurrencies.includes(c.value),
  );

  const examTypeOptions = examTypes.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const onSubmit = async (data: PlanDrawerValues) => {
    try {
      const prices = (data.prices ?? []).map((p) => ({
        currency: p.currency,
        amount: Number(p.amount),
        stripePriceId: p.stripePriceId || undefined,
        paystackPlanCode: p.paystackPlanCode || undefined,
      }));

      if (isEdit) {
        await updatePlan(plan.id, {
          name: data.name,
          description: data.description || undefined,
          durationDays: Number(data.durationDays),
          sortOrder: Number(data.sortOrder),
          stripeProductId: data.stripeProductId || undefined,
          prices: prices.length ? prices : undefined,
        });
      } else {
        await createPlan({
          examTypeId: data.examTypeId,
          name: data.name,
          description: data.description || undefined,
          durationDays: Number(data.durationDays),
          sortOrder: Number(data.sortOrder),
          stripeProductId: data.stripeProductId || undefined,
          prices: prices.length ? prices : undefined,
        });
      }
      onClose();
    } catch {
      // error toasted in store
    }
  };

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[720px] bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
          <div>
            <p className="font-semibold text-[#101828]">
              {isEdit ? "Edit Plan" : "New Plan"}
            </p>
            {isEdit && <p className="text-sm text-[#667085]">{plan.name}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#344054]"
          >
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form
            id="plan-drawer-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* ── Plan Details ─────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              {/* Exam Type */}
              {isEdit ? (
                <div>
                  <p className="text-xs font-medium text-[#667085] mb-1">
                    Exam Type
                  </p>
                  <p className="text-sm font-medium text-[#344054]">
                    {plan.examType?.name ?? "—"}
                  </p>
                </div>
              ) : (
                <Controller
                  name="examTypeId"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      {...field}
                      type="select"
                      label="Exam Type"
                      placeholder="Select exam type…"
                      value={field.value || null}
                      selectOptions={examTypeOptions}
                      error={errors.examTypeId?.message}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  )}
                />
              )}

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    label="Name"
                    placeholder="e.g. 2-Month Plan"
                    error={errors.name?.message}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <InputField
                    {...field}
                    type="textarea"
                    label="Description"
                    placeholder="Optional description…"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="durationDays"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[#344054]">
                          Duration (days)
                        </span>
                        <span
                          title="Number of days the subscription remains active after purchase"
                          className="cursor-help text-[#98A2B3]"
                        >
                          <Icon
                            icon="hugeicons:information-circle"
                            width={13}
                          />
                        </span>
                      </div>
                      <InputField
                        {...field}
                        type="number"
                        label={null}
                        value={String(field.value)}
                        error={errors.durationDays?.message}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />
                <Controller
                  name="sortOrder"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[#344054]">
                          Sort Order
                        </span>
                        <span
                          title="Plans with lower sort order numbers appear first in the list"
                          className="cursor-help text-[#98A2B3]"
                        >
                          <Icon
                            icon="hugeicons:information-circle"
                            width={13}
                          />
                        </span>
                      </div>
                      <InputField
                        {...field}
                        type="number"
                        label={null}
                        value={String(field.value)}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  )}
                />
              </div>

              <Controller
                name="stripeProductId"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#344054]">
                        Stripe Product ID
                      </span>
                      <span
                        title="The product ID from your Stripe dashboard (e.g. prod_…). All Stripe price IDs for this plan should belong to this product."
                        className="cursor-help text-[#98A2B3]"
                      >
                        <Icon icon="hugeicons:information-circle" width={13} />
                      </span>
                    </div>
                    <InputField
                      {...field}
                      label={null}
                      placeholder="prod_…"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </div>
                )}
              />
            </div>

            <hr className="border-[#F0F2F5]" />

            {/* ── Currency Pricing ─────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#98A2B3] uppercase tracking-widest">
                    Currency Pricing
                  </p>
                  <p className="text-[11px] text-[#B0B8C4] mt-0.5">
                    USD needs Stripe (US/AU); Paystack code (GH/KE/ZA) is
                    optional.
                  </p>
                </div>
                {availableCurrencies.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      append({
                        currency: availableCurrencies[0].value,
                        amount: 0,
                        stripePriceId: "",
                        paystackPlanCode: "",
                      })
                    }
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
                  >
                    <Icon icon="hugeicons:add-01" width={12} />
                    Add Currency
                  </button>
                )}
              </div>

              {typeof errors.prices?.message === "string" && (
                <p className="text-xs text-[#D42620]">
                  {errors.prices.message}
                </p>
              )}

              {fields.length === 0 && (
                <div className="border border-dashed border-[#D0D5DD] rounded-xl p-8 text-center">
                  <Icon
                    icon="hugeicons:money-exchange-02"
                    width={32}
                    className="text-[#D0D5DD] mx-auto mb-2"
                  />
                  <p className="text-sm text-[#98A2B3]">
                    No currency pricing yet.
                  </p>
                  <p className="text-xs text-[#B0B8C4] mt-0.5">
                    Click &ldquo;Add Currency&rdquo; to configure pricing.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => {
                  const currency = watchedPrices?.[index]?.currency ?? "";
                  const needsStripe = [
                    "USD",
                    "GBP",
                    "EUR",
                    "CAD",
                    "AUD",
                  ].includes(currency);
                  const needsPaystack = ["NGN", "USD"].includes(currency);
                  const isUSD = currency === "USD";
                  const priceErrors = errors.prices?.[index] as
                    | Record<string, { message?: string }>
                    | undefined;

                  // Options: current currency + any not yet used
                  const currencySelectOptions = ALL_CURRENCIES.filter(
                    (c) =>
                      c.value === currency || !usedCurrencies.includes(c.value),
                  );

                  return (
                    <div
                      key={field.id}
                      className="border border-[#E4E7EC] rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-end justify-between gap-3">
                        <div className="flex-1">
                          <Controller
                            name={`prices.${index}.currency`}
                            control={control}
                            render={({ field: cf }) => (
                              <InputField
                                {...cf}
                                type="select"
                                label="Currency"
                                value={cf.value || null}
                                selectOptions={currencySelectOptions}
                                onChange={(e) => cf.onChange(e.target.value)}
                              />
                            )}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          title="Remove this currency"
                          className="mb-0.5 p-1.5 rounded-lg text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
                        >
                          <Icon icon="hugeicons:delete-02" width={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Controller
                          name={`prices.${index}.amount`}
                          control={control}
                          render={({ field: af }) => (
                            <InputField
                              {...af}
                              type="number"
                              label={`Amount (${currency || "—"})`}
                              value={String(af.value ?? 0)}
                              error={priceErrors?.amount?.message}
                              onChange={(e) =>
                                af.onChange(Number(e.target.value))
                              }
                            />
                          )}
                        />

                        {needsStripe && (
                          <Controller
                            name={`prices.${index}.stripePriceId`}
                            control={control}
                            render={({ field: sf }) => (
                              <InputField
                                {...sf}
                                label={
                                  isUSD
                                    ? "Stripe Price ID (US/AU)"
                                    : "Stripe Price ID"
                                }
                                placeholder="price_…"
                                value={sf.value ?? ""}
                                error={priceErrors?.stripePriceId?.message}
                                onChange={(e) => sf.onChange(e.target.value)}
                              />
                            )}
                          />
                        )}

                        {needsPaystack && (
                          <div className={isUSD ? "col-span-2" : ""}>
                            <Controller
                              name={`prices.${index}.paystackPlanCode`}
                              control={control}
                              render={({ field: pf }) => (
                                <InputField
                                  {...pf}
                                  label={
                                    isUSD
                                      ? "Paystack Code (GH/KE/ZA) — Optional"
                                      : "Paystack Plan Code"
                                  }
                                  placeholder="PLN_…"
                                  value={pf.value ?? ""}
                                  error={priceErrors?.paystackPlanCode?.message}
                                  onChange={(e) => pf.onChange(e.target.value)}
                                />
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EAECF0] flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="plan-drawer-form"
            loading={isSubmitting}
            className="flex-1"
          >
            {isEdit ? "Save Changes" : "Create Plan"}
          </Button>
        </div>
      </div>
    </div>
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
          Delete <span className="font-medium text-[#344054]">{plan.name}</span>
          ? This cannot be undone and may affect active subscriptions.
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
                  <p className="text-xs text-[#667085]">
                    {s.sponsor.user.email}
                  </p>
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
        <span className="text-sm text-[#344054]">
          {s.examType?.name ?? "—"}
        </span>
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
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: CARD_SHADOW }}
      >
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
              if (p < cursorPage && cursorPage > 1)
                void fetchSubs(cursorPage - 1);
              else if (p > cursorPage && hasMore)
                void fetchSubs(cursorPage + 1);
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

const PLANS_PAGE_SIZE = 50;

function PlansTab({ canWrite }: { canWrite: boolean }) {
  const { plans, loadingPlans, fetchPlans, updatePlan } =
    useAdminSubscriptionsStore();

  const [drawer, setDrawer] = useState<
    { type: "create" } | { type: "edit"; plan: IAdminSubscriptionPlan } | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<IAdminSubscriptionPlan | null>(null);

  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (plans.length === 0) void fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPlans = plans.filter((p) => {
    if (!searchApplied) return true;
    const q = searchApplied.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.examType?.name ?? "").toLowerCase().includes(q)
    );
  });
  const pagedPlans = filteredPlans.slice(
    (page - 1) * PLANS_PAGE_SIZE,
    page * PLANS_PAGE_SIZE,
  );

  const columns: Column<IAdminSubscriptionPlan>[] = [
    {
      key: "name",
      header: "Plan Name",
      render: (p) => (
        <div>
          <p className="font-medium text-[#101828] text-sm">{p.name}</p>
          {p.description && (
            <p className="text-xs text-[#667085] mt-0.5 line-clamp-1">
              {p.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "examType",
      header: "Exam Type",
      render: (p) => (
        <span className="text-sm text-[#344054]">
          {p.examType?.name ?? "—"}
        </span>
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
      render: (p) => (
        <span className="text-sm text-[#667085]">{p.sortOrder}</span>
      ),
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
      key: "currencies",
      header: "Currencies",
      render: (p) => {
        const codes = (p.prices ?? []).map((pr) => pr.currency);
        if (!codes.length)
          return <span className="text-xs text-[#667085]">—</span>;
        return (
          <div className="flex gap-1 flex-wrap">
            {codes.map((c) => (
              <span
                key={c}
                className="text-[0.65rem] bg-[#F0F2F5] text-[#344054] px-2 py-0.5 rounded-full font-mono"
              >
                {c}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (p) => {
        if (!canWrite) return null;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawer({ type: "edit", plan: p })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingPlanId(p.id);
                try {
                  await updatePlan(p.id, { isActive: !p.isActive });
                } catch {
                  // toasted
                }
                setTogglingPlanId(null);
              }}
              disabled={togglingPlanId === p.id}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                p.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {p.isActive ? "Deactivate" : "Activate"}
              {togglingPlanId === p.id && <Spinner />}
            </button>
            <button
              onClick={() => setDeleteTarget(p)}
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
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Subscription Plans</p>
            <p className="text-sm text-[#667085]">
              {filteredPlans.length} plan{filteredPlans.length !== 1 ? "s" : ""}
            </p>
          </div>
          {canWrite && (
            <Button
              onClick={() => setDrawer({ type: "create" })}
              className="flex items-center gap-2"
            >
              <Icon icon="hugeicons:add-01" width={16} height={16} />
              New Plan
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
            onSearch: () => {
              setSearchApplied(search);
              setPage(1);
            },
            placeholder: "Search plans...",
          }}
          pagination
          metaData={{
            currentPage: (page - 1) * PLANS_PAGE_SIZE + 1,
            endPage:
              filteredPlans.length > page * PLANS_PAGE_SIZE
                ? page * PLANS_PAGE_SIZE + 1
                : (page - 1) * PLANS_PAGE_SIZE + 1,
            totalRecords: filteredPlans.length,
            onPageChange: (skip) =>
              setPage(Math.floor(skip / PLANS_PAGE_SIZE) + 1),
          }}
        />
      </div>

      {drawer?.type === "create" && (
        <PlanDrawer plan={null} onClose={() => setDrawer(null)} />
      )}
      {drawer?.type === "edit" && (
        <PlanDrawer plan={drawer.plan} onClose={() => setDrawer(null)} />
      )}
      {deleteTarget && (
        <DeletePlanModal
          plan={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─── Region Form Modal ─────────────────────────────────────────────────────────

function RegionFormModal({
  region,
  onClose,
  onSave,
}: {
  region: IRegionCurrency | null;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}) {
  const isEdit = region !== null;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    regionCode: region?.regionCode ?? "",
    regionName: region?.regionName ?? "",
    currency: region?.currency ?? "USD",
    paymentProvider: region?.paymentProvider ?? "stripe",
    isActive: region?.isActive ?? true,
  });

  const handle = async () => {
    setLoading(true);
    try {
      await onSave(form);
    } catch {
      // toasted in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6 flex flex-col gap-4">
        <div>
          <p className="font-semibold text-[#101828]">
            {isEdit ? "Edit Region" : "Add Region"}
          </p>
          <p className="text-sm text-[#667085] mt-0.5">
            {isEdit
              ? `Editing ${region.regionCode}`
              : "Map a new country to a currency and provider"}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {!isEdit && (
            <InputField
              label="Country Code (ISO 3166-1)"
              placeholder="e.g. NG, US, GB"
              value={form.regionCode}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  regionCode: e.target.value.toUpperCase(),
                }))
              }
            />
          )}
          <InputField
            label="Region Name"
            placeholder="e.g. Nigeria"
            value={form.regionName}
            onChange={(e) =>
              setForm((p) => ({ ...p, regionName: e.target.value }))
            }
          />
          <InputField
            type="select"
            label="Currency"
            value={form.currency || null}
            selectOptions={CURRENCY_OPTIONS}
            onChange={(e) =>
              setForm((p) => ({ ...p, currency: e.target.value }))
            }
          />
          <InputField
            type="select"
            label="Payment Provider"
            value={form.paymentProvider || null}
            selectOptions={PROVIDER_OPTIONS}
            onChange={(e) =>
              setForm((p) => ({ ...p, paymentProvider: e.target.value }))
            }
          />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button loading={loading} onClick={handle} className="flex-1">
            {isEdit ? "Save Changes" : "Add Region"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Region Config Tab ─────────────────────────────────────────────────────────

function RegionConfigTab({ canWrite }: { canWrite: boolean }) {
  const {
    regionCurrencies,
    loadingRegions,
    regionTotal,
    regionPage,
    fetchRegionCurrencies,
    createRegionCurrency,
    updateRegionCurrency,
  } = useAdminSubscriptionsStore();

  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<IRegionCurrency | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [togglingRegionId, setTogglingRegionId] = useState<string | null>(null);

  useEffect(() => {
    fetchRegionCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<IRegionCurrency>[] = [
    {
      key: "regionCode",
      header: "Code",
      render: (r) => (
        <span className="font-mono font-semibold text-[#344054] text-sm">
          {r.regionCode}
        </span>
      ),
    },
    {
      key: "regionName",
      header: "Region",
      render: (r) => (
        <span className="text-sm text-[#101828]">{r.regionName}</span>
      ),
    },
    {
      key: "currency",
      header: "Currency",
      render: (r) => (
        <span className="text-sm font-medium text-[#344054]">{r.currency}</span>
      ),
    },
    {
      key: "paymentProvider",
      header: "Provider",
      render: (r) => (
        <StatusChip
          variant={r.paymentProvider === "stripe" ? "info" : "success"}
          label={r.paymentProvider === "stripe" ? "Stripe" : "Paystack"}
        />
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (r) => (
        <StatusChip
          variant={r.isActive ? "success" : "neutral"}
          label={r.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "id",
      header: "",
      render: (r) =>
        canWrite ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditTarget(r)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                setTogglingRegionId(r.id);
                try {
                  await updateRegionCurrency(r.id, { isActive: !r.isActive });
                } catch {
                  // toasted
                }
                setTogglingRegionId(null);
              }}
              disabled={togglingRegionId === r.id}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 ${
                r.isActive
                  ? "border-[#F3A218] text-[#F3A218] hover:bg-[#FFFBEB]"
                  : "border-[#099137] text-[#099137] hover:bg-[#F0FBF3]"
              }`}
            >
              {r.isActive ? "Deactivate" : "Activate"}
              {togglingRegionId === r.id && <Spinner />}
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <TabCard
        title="Region Config"
        subtitle="Map countries to currencies and payment providers"
        action={
          canWrite ? (
            <Button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2"
            >
              <Icon icon="hugeicons:add-01" width={16} /> Add Region
            </Button>
          ) : undefined
        }
      >
        <DataTable
          columns={columns}
          data={regionCurrencies}
          loading={loadingRegions}
          keyExtractor={(r) => r.id}
          emptyMessage="No regions configured"
          shouldNotHaveBorder
          searchProps={{
            value: search,
            onChange: setSearch,
            onSearch: () => fetchRegionCurrencies(1, search),
            placeholder: "Search by name or code…",
          }}
          pagination
          metaData={{
            currentPage: (regionPage - 1) * 50 + 1,
            endPage:
              regionTotal > regionPage * 50
                ? regionPage * 50 + 1
                : (regionPage - 1) * 50 + 1,
            totalRecords: regionTotal,
            onPageChange: (skip) =>
              fetchRegionCurrencies(Math.floor(skip / 50) + 1, search),
          }}
        />
      </TabCard>

      {editTarget && (
        <RegionFormModal
          region={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={async (data) => {
            await updateRegionCurrency(editTarget.id, data);
            setEditTarget(null);
          }}
        />
      )}

      {addOpen && (
        <RegionFormModal
          region={null}
          onClose={() => setAddOpen(false)}
          onSave={async (data) => {
            await createRegionCurrency(
              data as {
                regionCode: string;
                regionName: string;
                currency: string;
                paymentProvider: string;
              },
            );
            setAddOpen(false);
          }}
        />
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-[600] text-[#171717]">
          Subscriptions
        </h1>
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
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
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
      {activeTab === "Region Config" && (
        <RegionConfigTab canWrite={canWriteSubs} />
      )}
    </div>
  );
}
