import React from "react";
import { requirePermission, hasPermission } from "@/lib/auth/context";
import { getUsers } from "@/features/users/service";
import { UserManagementView } from "@/features/users/components/user-management-view";
import { getRoles } from "@/features/roles/service";

export default async function UsersPage() {
  // Enforce server-side authorization: user MUST have "users.read" permission
  const session = await requirePermission("users.read");

  const usersList = await getUsers();
  const rolesList = await getRoles();

  const canCreate = hasPermission(session, "users.create");
  const canEdit = hasPermission(session, "users.edit");
  const canDelete = hasPermission(session, "users.delete");

  return (
    <UserManagementView
      initialUsers={usersList}
      roles={rolesList}
      currentUser={session}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
