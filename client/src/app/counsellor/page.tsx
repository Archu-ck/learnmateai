"use client";

import RoleGuard from "@/components/RoleGuard";
import RoleDashboard from "@/components/RoleDashboard";

export default function CounsellorPage() {
  return (
    <RoleGuard allowedRoles={["counsellor"]}>
      <RoleDashboard
        roleTitle="Counsellor"
        roleDescription="Student wellbeing, behavioral records, and holistic student guidance."
      />
    </RoleGuard>
  );
}
