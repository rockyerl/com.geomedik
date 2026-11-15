import { db, ensureDbReady } from "@/db";
import { users, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, type SessionPayload } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import type { LoginInput } from "./dto";

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: SessionPayload;
}

export async function login(input: LoginInput, ipAddress?: string): Promise<LoginResult> {
  await ensureDbReady();

  // 1. Fetch user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email.toLowerCase()),
    with: {
      role: true,
    },
  });

  if (!user) {
    return { success: false, error: "Email atau password tidak sesuai" };
  }

  if (!user.isActive) {
    return { success: false, error: "Akun Anda telah dinonaktifkan. Hubungi administrator." };
  }

  // 2. Verify password hash
  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, error: "Email atau password tidak sesuai" };
  }

  // 3. Fetch permissions for the assigned role
  const rolePerms = await db
    .select({
      code: permissions.code,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, user.roleId));

  const permissionCodes = rolePerms.map((rp) => rp.code);

  const sessionPayload: SessionPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    roleId: user.role.id,
    roleCode: user.role.code,
    roleName: user.role.name,
    permissions: permissionCodes,
  };

  // 4. Set secure session cookie
  await setSessionCookie(sessionPayload);

  // 5. Record audit log
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "AUTH_LOGIN",
    resource: "auth",
    details: { roleCode: user.role.code },
    ipAddress,
  });

  return { success: true, user: sessionPayload };
}

export async function logout(userId?: string, email?: string): Promise<void> {
  if (userId) {
    await logAudit({
      actorId: userId,
      actorEmail: email,
      action: "AUTH_LOGOUT",
      resource: "auth",
    });
  }
  await clearSessionCookie();
}
