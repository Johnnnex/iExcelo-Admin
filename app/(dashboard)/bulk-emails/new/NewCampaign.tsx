"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAdminBulkEmailsStore } from "@/src/store/bulk-emails.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, CampaignCategory } from "@/src/types";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { CARD_SHADOW } from "@/src/utils";

// ─── Static data ──────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: {
  value: CampaignCategory;
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: string;
}[] = [
  {
    value: "newsletter",
    label: "Newsletter",
    description: "Weekly digest, tips, and platform news",
    color: "#007FFF",
    bg: "#EEF6FF",
    icon: "hugeicons:news-01",
  },
  {
    value: "promotions",
    label: "Promotions & Offers",
    description: "Discounts, deals, and time-limited offers",
    color: "#F3A218",
    bg: "#FFFBEB",
    icon: "hugeicons:sale-tag-01",
  },
  {
    value: "product_updates",
    label: "Product Updates",
    description: "New features, improvements, and announcements",
    color: "#099137",
    bg: "#F0FDF4",
    icon: "hugeicons:rocket-01",
  },
  {
    value: "security_alerts",
    label: "Security Alerts",
    description: "General security notices and awareness emails",
    color: "#D42620",
    bg: "#FEF3F2",
    icon: "hugeicons:shield-01",
  },
];

const AUDIENCE_OPTIONS: {
  value: string;
  label: string;
  description: string;
}[] = [
  {
    value: "all",
    label: "All Users",
    description: "Students, sponsors, and affiliates",
  },
  {
    value: "students",
    label: "Students",
    description: "Everyone with a student account",
  },
  {
    value: "sponsors",
    label: "Sponsors",
    description: "Everyone with a sponsor account",
  },
  {
    value: "affiliates",
    label: "Affiliates",
    description: "Everyone with an affiliate account",
  },
];

// ─── Multi-audience picker ────────────────────────────────────────────────────

function AudiencePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (key === "all") {
      onChange(["all"]);
      return;
    }
    const withoutAll = value.filter((v) => v !== "all");
    if (withoutAll.includes(key)) {
      const next = withoutAll.filter((v) => v !== key);
      onChange(next.length ? next : ["all"]);
    } else {
      onChange([...withoutAll, key]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {AUDIENCE_OPTIONS.map((o) => {
        const isAll = o.value === "all";
        const active = isAll
          ? value.includes("all")
          : value.includes(o.value) && !value.includes("all");
        const checkbox =
          !isAll && !value.includes("all")
            ? value.includes(o.value)
            : undefined;

        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
              active
                ? "border-[#007FFF] bg-[#EEF6FF]"
                : "border-[#E4E7EC] bg-white hover:border-[#B2CFFE]"
            }`}
          >
            {!isAll && (
              <div
                className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  checkbox
                    ? "bg-[#007FFF] border-[#007FFF]"
                    : "bg-white border-[#D0D5DD]"
                }`}
              >
                {checkbox && (
                  <Icon
                    icon="hugeicons:tick-02"
                    className="w-2.5 h-2.5 text-white"
                  />
                )}
              </div>
            )}
            <div>
              <span
                className={`text-sm font-medium block ${
                  active ? "text-[#007FFF]" : "text-[#344054]"
                }`}
              >
                {o.label}
              </span>
              <span className="text-xs text-[#667085]">{o.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NewCampaign() {
  const router = useRouter();
  const { createCampaign, savingCampaign } = useAdminBulkEmailsStore();
  const { canWrite } = useAdminAuthStore();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<CampaignCategory>("newsletter");
  const [audiences, setAudiences] = useState<string[]>(["all"]);
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!canWrite(AdminModule.BULK_EMAILS)) {
    router.replace("/bulk-emails");
    return null;
  }

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.value === category)!;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Campaign name is required";
    if (!subject.trim()) e.subject = "Email subject is required";
    if (!content.trim()) e.content = "Email body cannot be empty";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const ok = await createCampaign({
      name,
      subject,
      category,
      targetAudiences: audiences,
      content,
    });
    if (ok) router.push("/bulk-emails");
  };

  return (
    <div className="xl:px-8 px-3.5 py-5 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#667085] hover:text-[#344054] mb-6 transition-colors"
      >
        <Icon icon="hugeicons:arrow-left-01" width={16} />
        Back to Campaigns
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101828]">New Campaign</h1>
        <p className="text-sm text-[#667085] mt-1">
          Compose an email campaign and send it to your audience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Campaign details */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-5"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="font-semibold text-[#101828]">Campaign Details</p>

          <InputField
            label="Campaign Name"
            placeholder="e.g. January 2026 Newsletter"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((v) => ({ ...v, name: "" }));
            }}
            error={errors.name}
          />

          <InputField
            label="Email Subject"
            placeholder="e.g. Time to ace your exams — tips inside!"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setErrors((v) => ({ ...v, subject: "" }));
            }}
            error={errors.subject}
          />
        </div>

        {/* Category */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div>
            <p className="font-semibold text-[#101828]">Email Category</p>
            <p className="text-sm text-[#667085] mt-0.5">
              This determines which users receive the email based on their
              notification preferences.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  style={
                    active
                      ? { borderColor: cat.color, backgroundColor: cat.bg }
                      : undefined
                  }
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    active
                      ? ""
                      : "border-[#E4E7EC] bg-white hover:border-[#D0D5DD]"
                  }`}
                >
                  <div
                    className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: active ? cat.color : "#F2F4F7",
                    }}
                  >
                    <Icon
                      icon={cat.icon}
                      className="w-4 h-4"
                      style={{ color: active ? "#fff" : "#667085" }}
                    />
                  </div>
                  <div>
                    <span
                      className="text-sm font-medium block"
                      style={{ color: active ? cat.color : "#344054" }}
                    >
                      {cat.label}
                    </span>
                    <span className="text-xs text-[#667085]">
                      {cat.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Category info pill */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              backgroundColor: selectedCategory.bg,
              color: selectedCategory.color,
            }}
          >
            <Icon icon="hugeicons:information-circle" className="w-3.5 h-3.5 shrink-0" />
            <span>
              Only users who have opted in to{" "}
              <strong>{selectedCategory.label}</strong> emails will receive this
              campaign.
            </span>
          </div>
        </div>

        {/* Target audience */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div>
            <p className="font-semibold text-[#101828]">Target Audience</p>
            <p className="text-sm text-[#667085] mt-0.5">
              Select one or more user groups. You can combine roles — e.g.
              Students + Sponsors simultaneously.
            </p>
          </div>
          <AudiencePicker value={audiences} onChange={setAudiences} />

          {/* Summary chip */}
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Icon icon="hugeicons:users-01" className="w-3.5 h-3.5" />
            <span>
              Targeting:{" "}
              <strong className="text-[#344054]">
                {audiences.includes("all")
                  ? "All Users"
                  : audiences
                      .map(
                        (a) =>
                          AUDIENCE_OPTIONS.find((o) => o.value === a)?.label ??
                          a,
                      )
                      .join(" + ")}
              </strong>
            </span>
          </div>
        </div>

        {/* Email body */}
        <div
          className="bg-white rounded-2xl p-6 flex flex-col gap-3"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div>
            <p className="font-semibold text-[#101828]">Email Body</p>
            <p className="text-sm text-[#667085] mt-0.5">
              Write the message content. iExcelo&apos;s header and footer will
              wrap it automatically.
            </p>
          </div>
          <InputField
            label=""
            type="rich-text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrors((v) => ({ ...v, content: "" }));
            }}
            error={errors.content}
            richTextProps={{ maxHeight: "500px" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-white! text-[#344054]! border border-[#D0D5DD] hover:bg-[#F9FAFB]!"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={savingCampaign}
            className="flex-1 bg-[#007FFF]! hover:bg-[#0066CC]! text-white!"
          >
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
