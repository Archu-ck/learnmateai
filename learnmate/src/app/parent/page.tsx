"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function ParentPage() {
  return (
    <RoleGuard allowedRoles={["parent"]}>
      <RoleDashboard
        roleTitle="Parent"
        roleDescription="Monitor your children's academic performance, class marks, and teacher notices."
      />
    </RoleGuard>
  );
}
