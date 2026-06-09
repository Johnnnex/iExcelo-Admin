import jwt from "jsonwebtoken";
import type { ModulePermissionsMap } from "@/src/types";

export interface AdminTokenPayload {
  sub: string;
  role: string;
  isSuper: boolean;
  permissions: ModulePermissionsMap;
  iat: number;
  exp: number;
}

export function verifyAccessToken(token: string): AdminTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenPayload;
}
