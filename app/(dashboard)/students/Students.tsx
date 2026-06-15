"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAdminStudentsStore } from "@/src/store/students.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import { AdminModule, IAdminStudentListItem } from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CARD_SHADOW } from "@/src/utils";

// ─── Suspend Modal ─────────────────────────────────────────────────────────────

function SuspendModal({
  student,
  onClose,
}: {
  student: IAdminStudentListItem;
  onClose: () => void;
}) {
  const { suspendStudent } = useAdminStudentsStore();
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date) return;
    setLoading(true);
    await suspendStudent(student.userId, new Date(date).toISOString());
    setLoading(false);
    onClose();
  };

  const name = `${student.user.firstName} ${student.user.lastName}`;
  return (
    <Modal isOpen onClose={onClose} className="rounded-2xl w-full max-w-sm">
      <div className="p-6">
        <p className="font-semibold text-[#101828] mb-1">Suspend Student</p>
        <p className="text-sm text-[#667085] mb-5">
          Set a suspension end date for{" "}
          <span className="font-medium text-[#344054]">{name}</span>. They will
          be blocked until this date.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#344054]">
            Suspend Until
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm outline-none focus:border-[#007FFF]"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!date}
            className="flex-1 bg-[#D42620]! text-white"
          >
            Suspend
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
            className={`flex-1 text-white ${confirmClass ?? "!bg-[#007FFF]"}`}
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

type ModalState =
  | { type: "deactivate"; student: IAdminStudentListItem }
  | { type: "reactivate"; student: IAdminStudentListItem }
  | { type: "suspend"; student: IAdminStudentListItem }
  | { type: "unsuspend"; student: IAdminStudentListItem }
  | { type: "reset-password"; student: IAdminStudentListItem }
  | null;

export default function Students() {
  const {
    students,
    cursors,
    cursorPage,
    hasMore,
    loadingStudents,
    searchTerm,
    setSearchTerm,
    fetchStudents,
    resetStudentPassword,
    deactivateStudent,
    reactivateStudent,
    unsuspendStudent,
  } = useAdminStudentsStore();
  const { canWrite } = useAdminAuthStore();

  const [modal, setModal] = useState<ModalState>(null);
  const canWriteStudents = canWrite(AdminModule.STUDENTS);

  useEffect(() => {
    void fetchStudents(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();

  // Cursor-based pagination: endPage controls Next button
  // endPage > currentPage enables Next; endPage = currentPage disables it
  const endPage = hasMore ? cursorPage + 1 : cursorPage;
  // cursors array grows as pages are visited — prev is possible when cursorPage > 1
  const prevPage = cursorPage > 1 ? cursorPage - 1 : null;

  const columns: Column<IAdminStudentListItem>[] = [
    {
      key: "name",
      header: "Student",
      render: (s) => (
        <div>
          <p className="font-medium text-[#101828]">
            {s.user.firstName} {s.user.lastName}
          </p>
          <p className="text-xs text-[#667085]">{s.user.email}</p>
        </div>
      ),
    },
    {
      key: "totalQuestionsSolved",
      header: "Questions",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          {s.totalQuestionsSolved.toLocaleString()}
        </span>
      ),
    },
    {
      key: "overallAccuracy",
      header: "Accuracy",
      render: (s) => (
        <span className="text-sm text-[#344054]">
          {s.overallAccuracy.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "hasEverSubscribed",
      header: "Subscribed",
      render: (s) => (
        <StatusChip
          label={s.hasEverSubscribed ? "Yes" : "No"}
          variant={s.hasEverSubscribed ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "isSponsored",
      header: "Sponsored",
      render: (s) => (
        <StatusChip
          label={s.isSponsored ? "Yes" : "No"}
          variant={s.isSponsored ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => {
        const isSuspended =
          s.user.suspendedUntil && new Date(s.user.suspendedUntil) > now;
        if (!s.user.isActive)
          return <StatusChip label="Inactive" variant="error" />;
        if (isSuspended)
          return <StatusChip label="Suspended" variant="warning" />;
        return <StatusChip label="Active" variant="success" />;
      },
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
        if (!canWriteStudents) return null;
        const isSuspended =
          s.user.suspendedUntil && new Date(s.user.suspendedUntil) > now;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setModal({ type: "reset-password", student: s })}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors whitespace-nowrap"
            >
              Reset Password
            </button>
            {s.user.isActive ? (
              <button
                onClick={() => setModal({ type: "deactivate", student: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => setModal({ type: "reactivate", student: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors"
              >
                Reactivate
              </button>
            )}
            {isSuspended ? (
              <button
                onClick={() => setModal({ type: "unsuspend", student: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#F3A218] text-[#F3A218] hover:bg-[#FFFAEB] transition-colors"
              >
                Unsuspend
              </button>
            ) : (
              <button
                onClick={() => setModal({ type: "suspend", student: s })}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#667085] text-[#667085] hover:bg-[#F9FAFB] transition-colors"
              >
                Suspend
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
        <h1 className="text-2xl font-bold text-[#101828]">Students</h1>
        <p className="text-sm text-[#667085] mt-1">
          Manage student accounts, activity and access
        </p>
      </div>

      <div
        className="bg-white overflow-hidden rounded-2xl"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="px-6 py-4 border-b border-[#F0F2F5]">
          <p className="font-semibold text-[#101828]">All Students</p>
        </div>

        <DataTable
          columns={columns}
          data={students}
          loading={loadingStudents}
          keyExtractor={(s) => s.id}
          emptyMessage="No students yet."
          shouldNotHaveBorder
          searchProps={{
            value: searchTerm,
            onChange: setSearchTerm,
            onSearch: () => void fetchStudents(1),
            placeholder: "Search by name or email...",
          }}
          pagination
          metaData={{
            currentPage: cursorPage,
            endPage,
            totalRecords: students.length,
            onPageChange: (p) => {
              if (p < cursorPage && prevPage !== null)
                void fetchStudents(prevPage);
              else if (p > cursorPage && hasMore)
                void fetchStudents(cursorPage + 1);
            },
          }}
        />
      </div>

      {/* Modals */}
      {modal?.type === "reset-password" && (
        <ConfirmModal
          title="Reset Student Password"
          message={`Send a password reset email to ${modal.student.user.firstName} ${modal.student.user.lastName} (${modal.student.user.email})?`}
          confirmLabel="Send Reset Email"
          onConfirm={() => resetStudentPassword(modal.student.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "deactivate" && (
        <ConfirmModal
          title="Deactivate Student"
          message={`Deactivate ${modal.student.user.firstName} ${modal.student.user.lastName}? They will not be able to log in.`}
          confirmLabel="Deactivate"
          confirmClass="bg-[#D42620]!"
          onConfirm={() => deactivateStudent(modal.student.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reactivate" && (
        <ConfirmModal
          title="Reactivate Student"
          message={`Reactivate ${modal.student.user.firstName} ${modal.student.user.lastName}? They will be able to log in again.`}
          confirmLabel="Reactivate"
          confirmClass="bg-[#099137]!"
          onConfirm={() => reactivateStudent(modal.student.userId)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "suspend" && (
        <SuspendModal student={modal.student} onClose={() => setModal(null)} />
      )}
      {modal?.type === "unsuspend" && (
        <ConfirmModal
          title="Lift Suspension"
          message={`Remove the suspension from ${modal.student.user.firstName} ${modal.student.user.lastName}?`}
          confirmLabel="Unsuspend"
          onConfirm={() => unsuspendStudent(modal.student.userId)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
