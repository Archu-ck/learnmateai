"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function CoordinatorPage() {
  return (
    <RoleGuard allowedRoles={["coordinator"]}>
      <RoleDashboard
        roleTitle="Coordinator"
        roleDescription="Academic curriculum oversight, class configurations, and student performance metrics."
      />
    </RoleGuard>
  );
}
