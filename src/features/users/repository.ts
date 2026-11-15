import { db, ensureDbReady } from "@/db";
import { users, roles, type User, type Role } from "@/db/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface UserWithRole extends User {
  role: Role;
}

export async function getUsersList(options?: {
  search?: string;
  roleId?: string;
}): Promise<UserWithRole[]> {
  await ensureDbReady();
  const conditions = [];

  if (options?.search) {
    const pattern = `%${options.search}%`;
    conditions.push(or(like(users.name, pattern), like(users.email, pattern)));
  }

  if (options?.roleId && options.roleId !== "ALL") {
    conditions.push(eq(users.roleId, options.roleId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db.query.users.findMany({
    where: whereClause,
    with: {
      role: true,
    },
    orderBy: [desc(users.createdAt)],
  });

  return result as UserWithRole[];
}

export async function getUserById(id: string): Promise<UserWithRole | null> {
  await ensureDbReady();
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: {
      role: true,
    },
  });

  return (user as UserWithRole) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureDbReady();
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  return user || null;
}

export async function insertUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  isActive: boolean;
}): Promise<User> {
  await ensureDbReady();
  const id = randomUUID();
  const now = new Date();

  await db.insert(users).values({
    id,
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    roleId: data.roleId,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  });

  const created = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  return created!;
}

export async function updateUserRecord(
  id: string,
  data: {
    name: string;
    email: string;
    roleId: string;
    isActive: boolean;
    passwordHash?: string;
  }
): Promise<User> {
  await ensureDbReady();
  const now = new Date();
  const updateData: Partial<typeof users.$inferInsert> = {
    name: data.name,
    email: data.email.toLowerCase(),
    roleId: data.roleId,
    isActive: data.isActive,
    updatedAt: now,
  };

  if (data.passwordHash) {
    updateData.passwordHash = data.passwordHash;
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  const updated = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  return updated!;
}

export async function deleteUserRecord(id: string): Promise<void> {
  await ensureDbReady();
  await db.delete(users).where(eq(users.id, id));
}

export async function countSuperAdmins(): Promise<number> {
  await ensureDbReady();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(roles.code, "SUPER_ADMIN"), eq(users.isActive, true)));

  return Number(result?.count || 0);
}
