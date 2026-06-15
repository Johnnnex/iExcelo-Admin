import type { ModulePermissionsMap } from "@/src/types";

// Mirror of the backend AdminModule enum — used in proxy.ts without importing from the store.
export enum AdminModule {
  ADMIN_MANAGEMENT = "admin_management",
  EXAM_REVISION = "exam_revision",
  STUDENTS = "students",
  SPONSORS = "sponsors",
  AFFILIATES = "affiliates",
  SUBSCRIPTIONS = "subscriptions",
  TESTIMONIALS = "testimonials",
  BULK_EMAILS = "bulk_emails",
  ANALYTICS = "analytics",
  MESSAGES = "messages",
}

export interface PagePermission {
  module: AdminModule;
  action: "read" | "write";
}

// Keyed by route prefix. First matching prefix wins.
// Dashboard has no entry — it's always accessible to any authenticated admin.
export const PAGE_PERMISSION_MAP: Record<string, PagePermission> = {
  "/management": { module: AdminModule.ADMIN_MANAGEMENT, action: "read" },
  "/exam-revision": { module: AdminModule.EXAM_REVISION, action: "read" },
  "/students": { module: AdminModule.STUDENTS, action: "read" },
  "/sponsors": { module: AdminModule.SPONSORS, action: "read" },
  "/affiliates": { module: AdminModule.AFFILIATES, action: "read" },
  "/subscriptions": { module: AdminModule.SUBSCRIPTIONS, action: "read" },
  "/testimonials": { module: AdminModule.TESTIMONIALS, action: "read" },
  "/bulk-emails": { module: AdminModule.BULK_EMAILS, action: "read" },
  "/analytics": { module: AdminModule.ANALYTICS, action: "read" },
  "/messages": { module: AdminModule.MESSAGES, action: "read" },
};

export function hasPermission(
  permissions: ModulePermissionsMap,
  isSuper: boolean,
  module: AdminModule,
  action: "read" | "write",
): boolean {
  if (isSuper) return true;
  const p = permissions[module as keyof ModulePermissionsMap];
  if (!p) return false;
  return action === "read" ? p.canRead : p.canWrite;
}
