import { db, ensureDbReady } from "@/db";
import { navigationMenus, type NavigationMenu } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import type { SessionPayload } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/context";

export interface NavigationCategoryGroup {
  category: string;
  items: NavigationMenu[];
}

/**
 * Resolve dynamic navigation menus strictly filtered by the user's role permissions.
 * Fulfills requirement: "rolenya harus bisa dinamis untuk akses sidebarnya"
 */
export async function getDynamicSidebarNavigation(
  session: SessionPayload | null | undefined
): Promise<NavigationCategoryGroup[]> {
  if (!session) return [];

  await ensureDbReady();

  // Query all active navigation menus
  const allMenus = await db
    .select()
    .from(navigationMenus)
    .where(eq(navigationMenus.isActive, true))
    .orderBy(asc(navigationMenus.sortOrder));

  // Filter based on user's dynamic role permissions
  const allowedMenus = allMenus.filter((menu) => hasPermission(session, menu.requiredPermission));

  // Group by category (e.g. "Utama", "Administrasi")
  const groupsMap = new Map<string, NavigationMenu[]>();
  for (const item of allowedMenus) {
    const list = groupsMap.get(item.category) || [];
    list.push(item);
    groupsMap.set(item.category, list);
  }

  const result: NavigationCategoryGroup[] = [];
  for (const [category, items] of groupsMap.entries()) {
    result.push({ category, items });
  }

  return result;
}
