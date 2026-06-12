"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAdminBulkEmailsStore } from "@/src/store/bulk-emails.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, CampaignTargetAudience } from "@/src/types";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { CARD_SHADOW } from "@/src/utils";

const AUDIENCE_OPTIONS: { value: CampaignTargetAudience; label: string; description: string }[] = [
  { value: "all", label: "All Users", description: "Students, sponsors, and affiliates" },
  { value: "students", label: "Students only", description: "Everyone with a student account" },
  { value: "sponsors", label: "Sponsors only", description: "Everyone with a sponsor account" },
  { value: "affiliates", label: "Affiliates only", description: "Everyone with an affiliate account" },
];

export default function NewCampaign() {
  const router = useRouter();
  const { createCampaign, savingCampaign } = useAdminBulkEmailsStore();
  const { canWrite } = useAdminAuthStore();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState<CampaignTargetAudience>("all");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!canWrite(AdminModule.BULK_EMAILS)) {
    router.replace("/bulk-emails");
    return null;
  }

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
    const ok = await createCampaign({ name, subject, targetAudience: audience, content });
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
        {/* Campaign details card */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={{ boxShadow: CARD_SHADOW }}>
          <p className="font-semibold text-[#101828]">Campaign Details</p>

          <InputField
            label="Campaign Name"
            placeholder="e.g. January 2026 Newsletter"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((v) => ({ ...v, name: "" })); }}
            error={errors.name}
          />

          <InputField
            label="Email Subject"
            placeholder="e.g. 🎯 Time to ace your exams — tips inside!"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setErrors((v) => ({ ...v, subject: "" })); }}
            error={errors.subject}
          />

          {/* Audience selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#344054]">Target Audience</label>
            <div className="grid grid-cols-2 gap-3">
              {AUDIENCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAudience(o.value)}
                  className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all ${
                    audience === o.value
                      ? "border-[#007FFF] bg-[#EEF6FF]"
                      : "border-[#E4E7EC] bg-white hover:border-[#B2CFFE]"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      audience === o.value ? "text-[#007FFF]" : "text-[#344054]"
                    }`}
                  >
                    {o.label}
                  </span>
                  <span className="text-xs text-[#667085]">{o.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email body card */}
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-3" style={{ boxShadow: CARD_SHADOW }}>
          <div>
            <p className="font-semibold text-[#101828]">Email Body</p>
            <p className="text-sm text-[#667085] mt-0.5">
              Write the email content. Supports rich text, headings, bullet lists, and links.
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
