"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Icon } from "@iconify/react";
import { useAdminTestimonialsStore, TestimonialFormData } from "@/src/store/testimonials.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminTestimonial } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

// ─── Schema ────────────────────────────────────────────────────────────────────

const testimonialSchema = yup.object({
  name: yup.string().required("Name is required"),
  role: yup.string().nullable().default(null),
  content: yup.string().required("Content is required"),
  rating: yup.number().min(1).max(5).default(5),
  userId: yup.string().nullable().default(null),
});

type FormValues = yup.InferType<typeof testimonialSchema>;

// ─── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-xl transition-transform hover:scale-110"
        >
          <Icon
            icon={star <= value ? "hugeicons:star" : "hugeicons:star-off"}
            className={star <= value ? "text-[#F3A218]" : "text-[#D0D5DD]"}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Testimonial Form Modal ────────────────────────────────────────────────────

function TestimonialModal({
  editItem,
  onClose,
}: {
  editItem?: IAdminTestimonial;
  onClose: () => void;
}) {
  const { createTestimonial, updateTestimonial } = useAdminTestimonialsStore();
  const isEdit = !!editItem;

  const { handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: yupResolver(testimonialSchema),
      defaultValues: {
        name: editItem?.name ?? "",
        role: editItem?.role ?? null,
        content: editItem?.content ?? "",
        rating: editItem?.rating ?? 5,
        userId: editItem?.userId ?? null,
      },
    });

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    const data: TestimonialFormData = {
      name: values.name,
      role: values.role ?? null,
      content: values.content,
      rating: values.rating,
      userId: values.userId ?? null,
    };
    if (isEdit) {
      await updateTestimonial(editItem.id, data, onClose);
    } else {
      await createTestimonial(data, onClose);
    }
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E4E7EC]">
          <p className="font-semibold text-[#101828]">
            {isEdit ? "Edit Testimonial" : "Add New Testimonial"}
          </p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F2F4F7]">
            <Icon icon="hugeicons:cancel-01" className="w-5 h-5 text-[#667085]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputField
                label="Name"
                placeholder="e.g. Adaeze Okafor"
                error={errors.name?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <InputField
                label="Role / Title"
                placeholder="e.g. SS3 Student, JAMB Candidate"
                error={errors.role?.message}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                onBlur={field.onBlur}
              />
            )}
          />
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <InputField
                label="Testimonial Content"
                type="textarea"
                placeholder="What did they say?"
                error={errors.content?.message}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#344054]">Rating</label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <StarRating value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <Controller
            name="userId"
            control={control}
            render={({ field }) => (
              <InputField
                label="Link to User (optional)"
                placeholder="User ID"
                error={errors.userId?.message}
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target.value as string) || null)}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#E4E7EC]">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1 bg-[#007FFF] hover:bg-[#0066CC] text-white"
          >
            {isEdit ? "Save Changes" : "Create Testimonial"}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  item,
  onClose,
}: {
  item: IAdminTestimonial;
  onClose: () => void;
}) {
  const { deleteTestimonial } = useAdminTestimonialsStore();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await deleteTestimonial(item.id);
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Delete Testimonial</p>
        <p className="text-sm text-[#667085] mb-5">
          Delete testimonial from{" "}
          <span className="font-medium text-[#344054]">{item.name}</span>? This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handle}
            loading={loading}
            className="flex-1 bg-[#D42620] hover:bg-[#b01e19] text-white"
          >
            Delete
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
  | { type: "create" }
  | { type: "edit"; item: IAdminTestimonial }
  | { type: "delete"; item: IAdminTestimonial }
  | null;

export default function Testimonials() {
  const {
    testimonials, loadingTestimonials,
    fetchTestimonials, togglePublish, reorder,
  } = useAdminTestimonialsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canWriteTestimonials = canWrite(AdminModule.TESTIMONIALS);

  useEffect(() => {
    void fetchTestimonials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    await togglePublish(id);
    setTogglingId(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const ids = testimonials.map((t) => t.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    void reorder(ids);
  };

  const moveDown = (index: number) => {
    if (index === testimonials.length - 1) return;
    const ids = testimonials.map((t) => t.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    void reorder(ids);
  };

  const columns: Column<IAdminTestimonial>[] = [
    {
      key: "order",
      header: "Order",
      width: "80px",
      render: (t) => {
        const index = testimonials.findIndex((x) => x.id === t.id);
        if (!canWriteTestimonials) {
          return <span className="text-sm text-[#667085]">{t.displayOrder + 1}</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <button
              disabled={index === 0}
              onClick={() => moveUp(index)}
              className="p-1 rounded hover:bg-[#F2F4F7] disabled:opacity-30 transition-colors"
            >
              <Icon icon="hugeicons:arrow-up-01" className="w-3.5 h-3.5 text-[#667085]" />
            </button>
            <button
              disabled={index === testimonials.length - 1}
              onClick={() => moveDown(index)}
              className="p-1 rounded hover:bg-[#F2F4F7] disabled:opacity-30 transition-colors"
            >
              <Icon icon="hugeicons:arrow-down-01" className="w-3.5 h-3.5 text-[#667085]" />
            </button>
          </div>
        );
      },
    },
    {
      key: "name",
      header: "Name",
      render: (t) => (
        <div>
          <p className="font-medium text-[#101828]">{t.name}</p>
          {t.role && <p className="text-xs text-[#667085]">{t.role}</p>}
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      render: (t) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon
              key={i}
              icon={i < t.rating ? "hugeicons:star" : "hugeicons:star-off"}
              className={`w-3.5 h-3.5 ${i < t.rating ? "text-[#F3A218]" : "text-[#D0D5DD]"}`}
            />
          ))}
        </div>
      ),
    },
    {
      key: "content",
      header: "Content",
      render: (t) => (
        <p className="text-sm text-[#344054] max-w-xs truncate">{t.content}</p>
      ),
    },
    {
      key: "isPublished",
      header: "Published",
      render: (t) => (
        <StatusChip
          label={t.isPublished ? "Published" : "Draft"}
          variant={t.isPublished ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div className="flex items-center gap-2">
          {canWriteTestimonials && (
            <>
              <button
                disabled={togglingId === t.id}
                onClick={() => void handleToggle(t.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  t.isPublished
                    ? "border-[#667085] text-[#667085] hover:bg-[#F9FAFB]"
                    : "border-[#099137] text-[#099137] hover:bg-[#F0FDF4]"
                } disabled:opacity-50`}
              >
                {togglingId === t.id ? "…" : t.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => setModal({ type: "edit", item: t })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setModal({ type: "delete", item: t })}
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
    <section className="xl:px-[2rem] px-[.875rem] py-[1.25rem]">
      {/* Header */}
      <div className="flex mb-6 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Testimonials</h1>
          <p className="text-sm text-[#667085] mt-1">
            Manage testimonials shown on the landing page
          </p>
        </div>
        {canWriteTestimonials && (
          <Button
            onClick={() => setModal({ type: "create" })}
            className="bg-[#007FFF] text-white hover:bg-[#0066CC] shrink-0"
          >
            <Icon icon="hugeicons:plus-sign" className="w-4 h-4" />
            Add Testimonial
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl flex flex-col" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">All Testimonials</p>
            <p className="text-sm text-[#667085]">{testimonials.length} total</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={testimonials}
          loading={loadingTestimonials}
          keyExtractor={(t) => t.id}
          emptyMessage="No testimonials yet. Add the first one."
        />
      </div>

      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <TestimonialModal
          editItem={modal.type === "edit" ? modal.item : undefined}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal item={modal.item} onClose={() => setModal(null)} />
      )}
    </section>
  );
}
