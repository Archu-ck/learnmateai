"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function StudentPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <RoleDashboard
        roleTitle="Student"
        roleDescription="Access your enrolled subjects, course assignments, marks, and personal AI tutor."
      />
    </RoleGuard>
  );
}
