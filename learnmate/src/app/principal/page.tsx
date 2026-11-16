"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function PrincipalPage() {
  return (
    <RoleGuard allowedRoles={["principal"]}>
      <RoleDashboard
        roleTitle="Principal"
        roleDescription="Institutional leadership, school-wide academic analytics, marks overview, and announcements."
      />
    </RoleGuard>
  );
}
