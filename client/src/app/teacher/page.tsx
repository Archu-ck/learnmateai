"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function TeacherPage() {
  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <RoleDashboard
        roleTitle="Teacher"
        roleDescription="Manage classroom attendance, create and grade student assignments, and track class progress."
      />
    </RoleGuard>
  );
}
