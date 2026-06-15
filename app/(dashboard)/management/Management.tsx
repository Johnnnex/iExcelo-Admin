"use client";

import {
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Icon } from "@iconify/react";
import { useManagementStore } from "@/src/store/management.store";
import { useAdminAuthStore } from "@/src/store/auth.store";
import {
  IAdminListItem,
  IAdminRole,
  AdminModule,
  ModulePermission,
  ModulePermissionsMap,
} from "@/src/types";
import { DataTable, Column } from "@/src/components/molecules/DataTable";
import { Modal } from "@/src/components/molecules/Modal";
import { InputField } from "@/src/components/molecules/InputField";
import { Button } from "@/src/components/atoms/Button";
import { StatusChip } from "@/src/components/atoms/StatusChip";
import { CheckBox } from "@/src/components/atoms/CheckBox";
import {
  inviteAdminSchema,
  InviteAdminValues,
  createRoleSchema,
  CreateRoleValues,
} from "@/src/schemas/management.schema";
import { CARD_SHADOW } from "@/src/utils";

// ─── All admin modules for permission toggles ──────────────────────────────

const ALL_MODULES: { key: AdminModule; label: string }[] = [
  { key: AdminModule.ADMIN_MANAGEMENT, label: "Admin Management" },
  { key: AdminModule.EXAM_REVISION, label: "Exam Revision" },
  { key: AdminModule.STUDENTS, label: "Students" },
  { key: AdminModule.SPONSORS, label: "Sponsors" },
  { key: AdminModule.AFFILIATES, label: "Affiliates" },
  { key: AdminModule.SUBSCRIPTIONS, label: "Subscriptions" },
  { key: AdminModule.TESTIMONIALS, label: "Testimonials" },
  { key: AdminModule.BULK_EMAILS, label: "Bulk Emails" },
  { key: AdminModule.ANALYTICS, label: "Analytics" },
  { key: AdminModule.MESSAGES, label: "Messages" },
];

// ─── Permissions Drawer ────────────────────────────────────────────────────

function PermissionsDrawer({
  admin,
  roles,
  onClose,
}: {
  admin: IAdminListItem | null;
  roles: IAdminRole[];
  onClose: () => void;
}) {
  const { updatePermissions } = useManagementStore();
  const [perms, setPerms] = useState<ModulePermissionsMap>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admin) setPerms({ ...admin.modulePermissions });
  }, [admin]);

  const defaultPerms = useMemo((): ModulePermissionsMap | null => {
    if (!admin?.roleId) return null;
    return roles.find((r) => r.id === admin.roleId)?.modules ?? null;
  }, [admin, roles]);

  const isAtDefault = useMemo(() => {
    if (!defaultPerms) return true;
    return ALL_MODULES.every(({ key }) => {
      const cur = perms[key] ?? { canRead: false, canWrite: false };
      const def = defaultPerms[key] ?? { canRead: false, canWrite: false };
      return cur.canRead === def.canRead && cur.canWrite === def.canWrite;
    });
  }, [perms, defaultPerms]);

  const toggle = (mod: AdminModule, key: "canRead" | "canWrite") => {
    setPerms((prev) => {
      const current: ModulePermission = prev[mod] ?? {
        canRead: false,
        canWrite: false,
      };
      const updated = { ...current, [key]: !current[key] };
      if (key === "canWrite" && updated.canWrite) updated.canRead = true;
      if (key === "canRead" && !updated.canRead) updated.canWrite = false;
      return { ...prev, [mod]: updated };
    });
  };

  const resetToDefault = () => {
    if (defaultPerms) setPerms({ ...defaultPerms });
  };

  const save = async () => {
    if (!admin) return;
    setSaving(true);
    await updatePermissions(admin.id, perms, onClose);
    setSaving(false);
  };

  return (
    <>
      {admin && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-[520px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          admin ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
          <div>
            <p className="font-semibold text-[#101828]">Module Permissions</p>
            {admin && (
              <p className="text-sm text-[#667085]">
                {admin.user?.firstName} {admin.user?.lastName}
                {admin.roleName && (
                  <span className="ml-2 text-xs bg-[#F2F4F7] text-[#344054] px-1.5 py-0.5 rounded">
                    {admin.roleName}
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#344054] transition-colors"
          >
            <Icon icon="hugeicons:cancel-01" width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {defaultPerms && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-[#667085]">
                Based on{" "}
                <span className="font-medium text-[#344054]">
                  {admin?.roleName}
                </span>{" "}
                template
              </p>
              <button
                onClick={resetToDefault}
                disabled={isAtDefault}
                className="text-xs text-[#007FFF] hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline transition-opacity"
              >
                Reset to defaults
              </button>
            </div>
          )}
          <div className="grid grid-cols-3 text-xs font-medium text-[#667085] uppercase tracking-wide mb-3 px-3">
            <span>Module</span>
            <span className="text-center">Read</span>
            <span className="text-center">Write</span>
          </div>
          <div className="flex flex-col gap-1">
            {ALL_MODULES.map(({ key, label }) => {
              const p: ModulePermission = perms[key] ?? {
                canRead: false,
                canWrite: false,
              };
              return (
                <div
                  key={key}
                  className="grid grid-cols-3 items-center px-3 py-3 rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  <span className="text-sm text-[#344054] font-medium">
                    {label}
                  </span>
                  <div className="flex justify-center">
                    <CheckBox
                      value={p.canRead}
                      onChange={() => toggle(key, "canRead")}
                    />
                  </div>
                  <div className="flex justify-center">
                    <CheckBox
                      value={p.canWrite}
                      onChange={() => toggle(key, "canWrite")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#EAECF0] flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button onClick={save} loading={saving} className="flex-1">
            Save Permissions
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Module toggles for role form ─────────────────────────────────────────

function ModuleToggles({
  value,
  onChange,
}: {
  value: ModulePermissionsMap;
  onChange: (v: ModulePermissionsMap) => void;
}) {
  const toggle = (mod: AdminModule, key: "canRead" | "canWrite") => {
    const current: ModulePermission = value[mod] ?? {
      canRead: false,
      canWrite: false,
    };
    const updated = { ...current, [key]: !current[key] };
    if (key === "canWrite" && updated.canWrite) updated.canRead = true;
    if (key === "canRead" && !updated.canRead) updated.canWrite = false;
    onChange({ ...value, [mod]: updated });
  };

  return (
    <div className="border border-[#EAECF0] rounded-lg overflow-hidden">
      <div className="grid grid-cols-3 text-xs font-medium text-[#667085] uppercase tracking-wide bg-[#F9FAFB] px-4 py-2 border-b border-[#EAECF0]">
        <span>Module</span>
        <span className="text-center">Read</span>
        <span className="text-center">Write</span>
      </div>
      {ALL_MODULES.map(({ key, label }, i) => {
        const p: ModulePermission = value[key] ?? {
          canRead: false,
          canWrite: false,
        };
        return (
          <div
            key={key}
            className={`grid grid-cols-3 items-center px-4 py-2.5 ${i < ALL_MODULES.length - 1 ? "border-b border-[#F0F2F5]" : ""}`}
          >
            <span className="text-sm text-[#344054]">{label}</span>
            <div className="flex justify-center">
              <CheckBox
                value={p.canRead}
                onChange={() => toggle(key, "canRead")}
              />
            </div>
            <div className="flex justify-center">
              <CheckBox
                value={p.canWrite}
                onChange={() => toggle(key, "canWrite")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Admins Tab ────────────────────────────────────────────────────────────

function AdminsTab() {
  const {
    admins,
    total,
    page,
    loadingAdmins,
    adminsSearch,
    setAdminsSearch,
    roles,
    loadingRoles,
    fetchAdmins,
    fetchRoles,
    inviteAdmin,
    deactivateAdmin,
    reactivateAdmin,
  } = useManagementStore();
  const { canWrite } = useAdminAuthStore();
  const canManage = canWrite(AdminModule.ADMIN_MANAGEMENT);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [drawerAdmin, setDrawerAdmin] = useState<IAdminListItem | null>(null);
  const [confirmAdmin, setConfirmAdmin] = useState<{
    admin: IAdminListItem;
    action: "deactivate" | "reactivate";
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteAdminValues>({
    resolver: yupResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: null,
      modulePermissions: {},
    },
  });

  const watchedRoleId = watch("roleId");
  const watchedPerms = watch("modulePermissions");

  useEffect(() => {
    fetchAdmins(1);
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill permissions when role template is selected
  useEffect(() => {
    if (watchedRoleId) {
      const role = roles.find((r) => r.id === watchedRoleId);
      if (role) setValue("modulePermissions", { ...role.modules });
    } else {
      setValue("modulePermissions", {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedRoleId]);

  const onInvite = async (data: InviteAdminValues) => {
    await inviteAdmin(
      {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId ?? null,
        modulePermissions: data.modulePermissions ?? {},
      },
      () => {
        setInviteOpen(false);
        reset();
      },
    );
  };

  const handleConfirm = async () => {
    if (!confirmAdmin) return;
    setConfirmLoading(true);
    if (confirmAdmin.action === "deactivate") {
      await deactivateAdmin(confirmAdmin.admin.id);
    } else {
      await reactivateAdmin(confirmAdmin.admin.id);
    }
    setConfirmLoading(false);
    setConfirmAdmin(null);
  };

  const roleOptions = (roles ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const columns: Column<IAdminListItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-[#101828]">
            {row.user?.firstName} {row.user?.lastName}
            {row.isSuper && (
              <span className="ml-2 text-[0.6rem] bg-[#007FFF] text-white px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                Super
              </span>
            )}
          </p>
          <p className="text-xs text-[#667085]">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="text-sm text-[#344054]">{row.roleName ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusChip
          variant={row.isActive ? "success" : "error"}
          label={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        !row.isSuper && canManage ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerAdmin(row)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Permissions
            </button>
            {row.isActive ? (
              <button
                onClick={() =>
                  setConfirmAdmin({ admin: row, action: "deactivate" })
                }
                className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() =>
                  setConfirmAdmin({ admin: row, action: "reactivate" })
                }
                className="text-xs px-2.5 py-1 rounded-lg border border-[#099137] text-[#099137] hover:bg-[#F0FDF4] transition-colors"
              >
                Reactivate
              </button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <div
        className="bg-white overflow-hidden rounded-2xl"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Admins</p>
            <p className="text-sm text-[#667085]">{total} total</p>
          </div>
          {canManage && (
            <Button
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2"
            >
              <Icon icon="hugeicons:user-add-01" width={16} height={16} />
              Invite Admin
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={admins}
          loading={loadingAdmins || loadingRoles}
          keyExtractor={(r) => r.id}
          emptyMessage="No admins found"
          shouldNotHaveBorder
          noFooterOverlap
          searchProps={{
            value: adminsSearch,
            onChange: setAdminsSearch,
            onSearch: () => fetchAdmins(1),
            placeholder: "Search by name or email...",
          }}
          pagination
          metaData={{
            currentPage: (page - 1) * 50 + 1,
            endPage: total > page * 50 ? page * 50 + 1 : (page - 1) * 50 + 1,
            totalRecords: total,
            onPageChange: (skip) => fetchAdmins(Math.floor(skip / 50) + 1),
          }}
        />
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          reset();
        }}
        className="w-full max-w-lg rounded-2xl p-6"
        overflowY="auto"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-lg font-semibold text-[#101828]">Invite Admin</p>
          <button
            onClick={() => {
              setInviteOpen(false);
              reset();
            }}
            className="text-[#667085]"
          >
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onInvite)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="First Name"
                  placeholder="John"
                  error={errors.firstName?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
          </div>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                error={errors.email?.message}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <InputField
                {...field}
                type="select"
                label="Role Template (optional)"
                placeholder="Select a role to pre-fill permissions..."
                value={field.value ?? null}
                selectOptions={roleOptions}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />

          {/* Module permissions — auto-filled from role, fully editable */}
          <div>
            <p className="text-sm font-medium text-[#344054] mb-2">
              Module Permissions
              {watchedRoleId && (
                <span className="ml-2 text-xs text-[#667085] font-normal">
                  Pre-filled from role template — edit freely
                </span>
              )}
            </p>
            <ModuleToggles
              value={watchedPerms ?? {}}
              onChange={(v) => setValue("modulePermissions", v)}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              onClick={() => {
                setInviteOpen(false);
                reset();
              }}
              className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate/Reactivate Modal */}
      <Modal
        isOpen={!!confirmAdmin}
        onClose={() => setConfirmAdmin(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">
          {confirmAdmin?.action === "deactivate"
            ? "Deactivate Admin"
            : "Reactivate Admin"}
        </p>
        <p className="text-sm text-[#667085] mb-6">
          Are you sure you want to {confirmAdmin?.action}{" "}
          <strong>
            {confirmAdmin?.admin.user?.firstName}{" "}
            {confirmAdmin?.admin.user?.lastName}
          </strong>
          ?
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setConfirmAdmin(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={confirmLoading}
            className={`flex-1 ${confirmAdmin?.action === "deactivate" ? "!bg-[#D42620]" : "!bg-[#099137]"}`}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Permissions Drawer */}
      <PermissionsDrawer
        admin={drawerAdmin}
        roles={roles}
        onClose={() => setDrawerAdmin(null)}
      />
    </>
  );
}

// ─── Roles Tab ─────────────────────────────────────────────────────────────

function RolesTab() {
  const {
    roles,
    loadingRoles,
    rolesSearch,
    rolesTotal,
    rolesPage,
    setRolesSearch,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  } = useManagementStore();
  const { canWrite } = useAdminAuthStore();
  const canManage = canWrite(AdminModule.ADMIN_MANAGEMENT);

  const [modalState, setModalState] = useState<{
    open: boolean;
    role: IAdminRole | null;
  }>({ open: false, role: null });
  const [modules, setModules] = useState<ModulePermissionsMap>({});
  const [deleteTarget, setDeleteTarget] = useState<IAdminRole | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleValues>({
    resolver: yupResolver(createRoleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = useCallback(() => {
    reset({ name: "", description: "" });
    setModules({});
    setModalState({ open: true, role: null });
  }, [reset]);

  const openEdit = useCallback(
    (role: IAdminRole) => {
      reset({ name: role.name, description: role.description ?? "" });
      setModules({ ...role.modules });
      setModalState({ open: true, role });
    },
    [reset],
  );

  const closeModal = useCallback(() => {
    setModalState({ open: false, role: null });
    reset();
    setModules({});
  }, [reset]);

  const onSubmit = async (data: CreateRoleValues) => {
    if (modalState.role) {
      await updateRole(modalState.role.id, { ...data, modules }, closeModal);
    } else {
      await createRole({ ...data, modules }, closeModal);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteRole(deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const columns: Column<IAdminRole>[] = [
    {
      key: "name",
      header: "Role Name",
      render: (row) => (
        <span className="font-medium text-[#101828]">{row.name}</span>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="text-sm text-[#667085]">{row.description ?? "—"}</span>
      ),
    },
    {
      key: "modules",
      header: "Permissions",
      render: (row) => {
        const count = Object.values(row.modules).filter(
          (m) => m?.canRead,
        ).length;
        return <span className="text-sm text-[#344054]">{count} modules</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        canManage ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openEdit(row)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#007FFF] text-[#007FFF] hover:bg-[#E5F0FF] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#D42620] text-[#D42620] hover:bg-[#FEF3F2] transition-colors"
            >
              Delete
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <div
        className="bg-white overflow-hidden rounded-2xl"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F5]">
          <div>
            <p className="font-semibold text-[#101828]">Role Templates</p>
            <p className="text-sm text-[#667085]">{rolesTotal} templates</p>
          </div>
          {canManage && (
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Icon icon="hugeicons:add-01" width={16} height={16} />
              New Role
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={roles}
          loading={loadingRoles}
          keyExtractor={(r) => r.id}
          emptyMessage="No role templates yet"
          shouldNotHaveBorder
          noFooterOverlap
          pagination
          metaData={{
            currentPage: (rolesPage - 1) * 50 + 1,
            endPage:
              rolesTotal > rolesPage * 50
                ? rolesPage * 50 + 1
                : (rolesPage - 1) * 50 + 1,
            totalRecords: rolesTotal,
            onPageChange: (skip) => fetchRoles(Math.floor(skip / 50) + 1),
          }}
          searchProps={{
            value: rolesSearch,
            onChange: setRolesSearch,
            onSearch: () => fetchRoles(1),
            placeholder: "Search role templates...",
          }}
        />
      </div>

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={modalState.open}
        onClose={closeModal}
        className="w-full max-w-lg rounded-2xl"
        overflowY="hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
          <p className="text-lg font-semibold text-[#101828]">
            {modalState.role ? "Edit Role" : "Create Role"}
          </p>
          <button onClick={closeModal} className="text-[#667085]">
            <Icon icon="hugeicons:cancel-01" width={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[80vh] px-6 py-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputField
                  {...field}
                  label="Role Name"
                  placeholder="e.g. Content Manager"
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
                  label="Description (optional)"
                  placeholder="Describe this role's responsibilities..."
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <div>
              <p className="text-sm font-medium text-[#344054] mb-2">
                Module Access
              </p>
              <ModuleToggles value={modules} onChange={setModules} />
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                onClick={closeModal}
                className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                {modalState.role ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        className="w-full max-w-sm rounded-2xl p-6"
      >
        <p className="text-lg font-semibold text-[#101828] mb-2">Delete Role</p>
        <p className="text-sm text-[#667085] mb-6">
          Delete <strong>{deleteTarget?.name}</strong>? Admins assigned this
          role will keep their current permissions.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => setDeleteTarget(null)}
            className="flex-1 !bg-white !text-[#344054] border border-[#D0D5DD]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            loading={deleteLoading}
            className="flex-1 !bg-[#D42620]"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Main Management Component ─────────────────────────────────────────────

const TABS = ["Admins", "Role Templates"] as const;
type Tab = (typeof TABS)[number];

export default function Management() {
  const [activeTab, setActiveTab] = useState<Tab>("Admins");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 4, width: 80 });

  useLayoutEffect(() => {
    const el = tabRefs.current[TABS.indexOf(activeTab)];
    if (el) setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[#101828]">Management</h1>
        <p className="text-sm text-[#667085] mt-1">
          Manage admin accounts, permissions, and role templates
        </p>
      </div>

      {/* Animated bouncy tab pill */}
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

      {activeTab === "Admins" ? <AdminsTab /> : <RolesTab />}
    </div>
  );
}
