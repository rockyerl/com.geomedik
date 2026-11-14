import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getRoles, getPermissionsList } from "@/features/roles/service";
import { RoleManagementView } from "@/features/roles/components/role-management-view";

export default async function RolesPage() {
  // Enforce server-side authorization: user MUST have "roles.read" permission
  const session = await requirePermission("roles.read");

  const rolesList = await getRoles();
  const allPermissions = await getPermissionsList();

  const canManage = hasPermission(session, "roles.manage");

  return (
    <RoleManagementView
      initialRoles={rolesList}
      allPermissions={allPermissions}
      currentUser={session}
      canManage={canManage}
    />
  );
}
