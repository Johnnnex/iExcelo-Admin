import * as yup from "yup";
import type { ModulePermissionsMap } from "@/src/types";

export const inviteAdminSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  roleId: yup.string().nullable().default(null),
  modulePermissions: yup.mixed<ModulePermissionsMap>().required().default({}),
});

export type InviteAdminValues = yup.InferType<typeof inviteAdminSchema>;

export const createRoleSchema = yup.object({
  name: yup.string().required("Role name is required"),
  description: yup.string().nullable().default(null),
});

export type CreateRoleValues = yup.InferType<typeof createRoleSchema>;
