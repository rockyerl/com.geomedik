import { db, ensureDbReady } from "@/db";
import {
  roles,
  permissions,
  rolePermissions,
  users,
  type Role,
  type Permission,
} from "@/db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface RoleWithDetails extends Role {
  userCount: number;
  permissions: Permission[];
}

export async function getAllRolesWithDetails(): Promise<RoleWithDetails[]> {
  await ensureDbReady();
  const allRoles = await db.select().from(roles).orderBy(asc(roles.createdAt));
  const result: RoleWithDetails[] = [];

  for (const role of allRoles) {
    // Count users in this role
    const [userCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.roleId, role.id));

    // Get permissions for this role
    const rolePerms = await db
      .select({
        id: permissions.id,
        code: permissions.code,
        name: permissions.name,
        group: permissions.group,
        description: permissions.description,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    result.push({
      ...role,
      userCount: Number(userCountResult?.count || 0),
      permissions: rolePerms,
    });
  }

  return result;
}

export async function getRoleById(id: string): Promise<RoleWithDetails | null> {
  await ensureDbReady();
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, id),
  });

  if (!role) return null;

  const [userCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.roleId, role.id));

  const rolePerms = await db
    .select({
      id: permissions.id,
      code: permissions.code,
      name: permissions.name,
      group: permissions.group,
      description: permissions.description,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, role.id));

  return {
    ...role,
    userCount: Number(userCountResult?.count || 0),
    permissions: rolePerms,
  };
}

export async function getAllPermissions(): Promise<Permission[]> {
  await ensureDbReady();
  return db.select().from(permissions).orderBy(asc(permissions.group), asc(permissions.name));
}

export async function createRoleWithPermissions(
  data: { name: string; code: string; description?: string },
  permissionIds: string[]
): Promise<Role> {
  await ensureDbReady();
  const id = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(roles).values({
      id,
      name: data.name,
      code: data.code,
      description: data.description || "",
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    });

    if (permissionIds.length > 0) {
      const permsToInsert = permissionIds.map((pId) => ({
        id: randomUUID(),
        roleId: id,
        permissionId: pId,
      }));
      await tx.insert(rolePermissions).values(permsToInsert);
    }
  });

  const created = await db.query.roles.findFirst({ where: eq(roles.id, id) });
  return created!;
}

export async function updateRoleWithPermissions(
  id: string,
  data: { name: string; description?: string },
  permissionIds: string[]
): Promise<Role> {
  await ensureDbReady();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(roles)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: now,
      })
      .where(eq(roles.id, id));

    // Delete existing permissions for this role and re-insert
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));

    if (permissionIds.length > 0) {
      const permsToInsert = permissionIds.map((pId) => ({
        id: randomUUID(),
        roleId: id,
        permissionId: pId,
      }));
      await tx.insert(rolePermissions).values(permsToInsert);
    }
  });

  const updated = await db.query.roles.findFirst({ where: eq(roles.id, id) });
  return updated!;
}

export async function deleteRoleById(id: string): Promise<void> {
  await ensureDbReady();
  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    await tx.delete(roles).where(eq(roles.id, id));
  });
}
