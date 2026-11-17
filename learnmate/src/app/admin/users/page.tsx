"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import StatusChip from "@/components/StatusChip";
import {
  Search,
  UserPlus,
  Filter,
  KeyRound,
  UserX,
  UserCheck,
  Edit2,
  Copy,
  Check,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "disabled";
  mustChangePassword?: boolean;
  admissionNo?: string;
  classId?: string;
  className?: string;
  sectionId?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  childIds?: any[];
  createdAt: string;
}

interface ClassOption {
  id: string;
  name: string;
  sections: string[];
}

export default function UsersDirectoryPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Classes list for student form
  const [classes, setClasses] = useState<ClassOption[]>([]);
  // Students list for parent form
  const [allStudents, setAllStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  // Parents list for student form
  const [allParents, setAllParents] = useState<Array<{ id: string; name: string; email: string }>>([]);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Temp Password Modal
  const [tempPassModal, setTempPassModal] = useState<{
    isOpen: boolean;
    name: string;
    email: string;
    tempPass: string;
    isReset?: boolean;
  }>({
    isOpen: false,
    name: "",
    email: "",
    tempPass: "",
  });

  const [copied, setCopied] = useState(false);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    admissionNo: "",
    classId: "",
    sectionId: "",
    parentId: "",
    parentName: "",
    parentEmail: "",
    childIds: [] as string[],
  });

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "student",
    status: "active",
    admissionNo: "",
    classId: "",
    sectionId: "",
    parentId: "",
    parentName: "",
    parentEmail: "",
    childIds: [] as string[],
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
        role: roleFilter,
        status: statusFilter,
      });
      const res = await api.get<{
        users: UserItem[];
        total?: number;
        page?: number;
        totalPages?: number;
        pagination?: { total: number; page: number; totalPages: number };
      }>(`/api/admin/users?${query.toString()}`);
      setUsers(res.users || []);
      const totalCount = res.total ?? res.pagination?.total ?? res.users?.length ?? 0;
      const totalPagesCount = res.totalPages ?? res.pagination?.totalPages ?? 1;
      setTotal(totalCount);
      setTotalPages(totalPagesCount);
    } catch (err: any) {
      toast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const classRes = await api.get<{ classes: Array<{ id: string; name: string; sections: string[] }> }>(
        "/api/admin/classes"
      );
      setClasses(classRes.classes || []);

      const studentRes = await api.get<{ users: UserItem[] }>("/api/admin/users?role=student&limit=100");
      setAllStudents(
        studentRes.users.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
        }))
      );

      const parentRes = await api.get<{ users: UserItem[] }>("/api/admin/users?role=parent&limit=100");
      setAllParents(
        parentRes.users.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
        }))
      );
    } catch (err) {
      console.error("Failed to load reference data", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    loadReferenceData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Add User Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: addForm.name,
        email: addForm.email,
        role: addForm.role,
        status: addForm.status,
      };

      if (addForm.role === "student") {
        payload.admissionNo = addForm.admissionNo;
        payload.classId = addForm.classId || undefined;
        payload.sectionId = addForm.sectionId || undefined;
        if (addForm.parentId) payload.parentId = addForm.parentId;
        if (addForm.parentName) payload.parentName = addForm.parentName;
        if (addForm.parentEmail) payload.parentEmail = addForm.parentEmail;
      } else if (addForm.role === "parent") {
        payload.childIds = addForm.childIds;
      }

      const res = await api.post<{
        message: string;
        user: UserItem;
        temporaryPassword?: string;
      }>("/api/admin/users", payload);

      toast(res.message);
      setIsAddOpen(false);
      setAddForm({
        name: "",
        email: "",
        role: "student",
        status: "active",
        admissionNo: "",
        classId: "",
        sectionId: "",
        parentId: "",
        parentName: "",
        parentEmail: "",
        childIds: [],
      });
      fetchUsers();
      loadReferenceData();

      if (res.temporaryPassword) {
        setTempPassModal({
          isOpen: true,
          name: res.user.name,
          email: res.user.email,
          tempPass: res.temporaryPassword,
          isReset: false,
        });
      }
    } catch (err: any) {
      toast(err.message || "Failed to create user", "error");
    }
  };

  // Edit User open
  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      admissionNo: user.admissionNo || "",
      classId: user.classId || "",
      sectionId: user.sectionId || "",
      parentId: user.parentId || "",
      parentName: user.parentName || "",
      parentEmail: user.parentEmail || "",
      childIds: user.childIds ? user.childIds.map((c: any) => (typeof c === "object" ? c._id || c.id : c)) : [],
    });
    setIsEditOpen(true);
  };

  // Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
      };

      if (editForm.role === "student") {
        payload.admissionNo = editForm.admissionNo;
        payload.classId = editForm.classId || null;
        payload.sectionId = editForm.sectionId || null;
        payload.parentId = editForm.parentId || null;
        if (editForm.parentName) payload.parentName = editForm.parentName;
        if (editForm.parentEmail) payload.parentEmail = editForm.parentEmail;
      } else if (editForm.role === "parent") {
        payload.childIds = editForm.childIds;
      }

      const res = await api.patch<{ message: string; user: UserItem }>(
        `/api/admin/users/${editingUser.id}`,
        payload
      );

      toast(res.message);
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to update user", "error");
    }
  };

  // Reset Password
  const handleResetPassword = async (user: UserItem) => {
    if (!confirm(`Are you sure you want to reset password for ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const res = await api.post<{
        message: string;
        temporaryPassword: string;
      }>(`/api/admin/users/${user.id}/reset-password`);

      toast(res.message);
      setTempPassModal({
        isOpen: true,
        name: user.name,
        email: user.email,
        tempPass: res.temporaryPassword,
        isReset: true,
      });
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to reset password", "error");
    }
  };

  // Disable / Enable user
  const toggleUserStatus = async (user: UserItem) => {
    const isDisabling = user.status === "active";
    const endpoint = isDisabling
      ? `/api/admin/users/${user.id}/disable`
      : `/api/admin/users/${user.id}/enable`;

    try {
      const res = await api.post<{ message: string }>(endpoint);
      toast(res.message);
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to change user status", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedClass = classes.find((c) => c.id === addForm.classId);
  const selectedEditClass = classes.find((c) => c.id === editForm.classId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            User Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage student, faculty, and administrative accounts, reset passwords, and assign roles.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Add User</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-card p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80 flex items-center">
          <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neu-input w-full pr-3.5 py-2 text-xs sm:text-sm"
            style={{ paddingLeft: "42px" }}
          />
        </form>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter size={14} className="text-slate-400" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="neu-input py-1.5 px-3 text-xs text-slate-700 cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="neu-input py-1.5 px-3 text-xs text-slate-700 cursor-pointer flex-1 sm:flex-initial"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="neu-card p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200/70 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">User</th>
                <th className="py-3 px-4 font-bold">Role</th>
                <th className="py-3 px-4 font-bold">Details / Class</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading directory entries...</span>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-white/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200/50">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-500/10 text-indigo-700 border border-indigo-200/40 uppercase tracking-wide">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {u.role === "student" && (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {u.className || "Unassigned"}
                              {u.sectionId ? ` (${u.sectionId})` : ""}
                            </span>
                            {u.admissionNo && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                Adm: {u.admissionNo}
                              </span>
                            )}
                            {u.parentName && (
                              <span className="inline-block mt-0.5 text-[10px] text-indigo-600 font-medium">
                                Parent: {u.parentName}
                              </span>
                            )}
                          </div>
                        )}
                        {u.role === "parent" && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {u.childIds && u.childIds.length > 0
                              ? `${u.childIds.length} Linked Student(s)`
                              : "No children linked"}
                          </span>
                        )}
                        {u.role !== "student" && u.role !== "parent" && (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusChip status={u.status === "active" ? "Active" : "Inactive"} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className="neu-btn p-2 text-slate-600 hover:text-indigo-600 cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={isSelf}
                            className={`neu-btn p-2 cursor-pointer ${
                              isSelf
                                ? "text-slate-300 opacity-40 cursor-not-allowed"
                                : u.status === "active"
                                ? "text-slate-600 hover:text-rose-600"
                                : "text-slate-600 hover:text-emerald-600"
                            }`}
                            title={
                              isSelf
                                ? "Cannot modify own account"
                                : u.status === "active"
                                ? "Disable User"
                                : "Enable User"
                            }
                          >
                            {u.status === "active" ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No users matching your criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {users.length} of {total} entries
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold text-slate-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="neu-btn px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neu-card bg-[#f0f3f8] max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Add New User</h2>
                <p className="text-xs text-slate-400 font-medium">Provision credentials for a student, teacher or staff</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Krishnan"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. meera@school.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="neu-input w-full cursor-pointer"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="neu-input w-full cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Dynamic student fields */}
              {addForm.role === "student" && (
                <div className="neu-inset p-4 space-y-3">
                  <p className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">
                    Student Details
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ADM-2026-042"
                      value={addForm.admissionNo}
                      onChange={(e) => setAddForm({ ...addForm, admissionNo: e.target.value })}
                      className="neu-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Class</label>
                      <select
                        value={addForm.classId}
                        onChange={(e) =>
                          setAddForm({ ...addForm, classId: e.target.value, sectionId: "" })
                        }
                        className="neu-input w-full cursor-pointer"
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Section</label>
                      <select
                        value={addForm.sectionId}
                        onChange={(e) => setAddForm({ ...addForm, sectionId: e.target.value })}
                        disabled={!selectedClass}
                        className="neu-input w-full cursor-pointer disabled:opacity-40"
                      >
                        <option value="">Select Section</option>
                        {selectedClass?.sections.map((s) => (
                          <option key={s} value={s}>
                            Section {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Linked Parent Information */}
                  <div className="border-t border-slate-200/80 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[11px] text-indigo-700 uppercase tracking-wider">
                        Connected Parent / Guardian
                      </p>
                      <span className="text-[10px] text-slate-400">Auto-Linked</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Connect to an existing parent or enter new parent details to automatically create and link their account.
                    </p>

                    {allParents.length > 0 && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                          Select Existing Parent (Optional)
                        </label>
                        <select
                          value={addForm.parentId}
                          onChange={(e) => setAddForm({ ...addForm, parentId: e.target.value })}
                          className="neu-input w-full cursor-pointer text-xs"
                        >
                          <option value="">-- Or enter new parent details below --</option>
                          {allParents.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!addForm.parentId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Parent Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Rajesh Sharma"
                            value={addForm.parentName}
                            onChange={(e) => setAddForm({ ...addForm, parentName: e.target.value })}
                            className="neu-input w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Parent Email</label>
                          <input
                            type="email"
                            placeholder="e.g. parent.sharma@learnmate.test"
                            value={addForm.parentEmail}
                            onChange={(e) => setAddForm({ ...addForm, parentEmail: e.target.value })}
                            className="neu-input w-full text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic parent fields */}
              {addForm.role === "parent" && (
                <div className="neu-inset p-4 space-y-2">
                  <p className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">
                    Link Children (Students)
                  </p>
                  <select
                    multiple
                    value={addForm.childIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setAddForm({ ...addForm, childIds: selected });
                    }}
                    className="neu-input w-full h-28 cursor-pointer"
                  >
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Hold Ctrl / Cmd to select multiple students</p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neu-card bg-[#f0f3f8] max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">Edit User Details</h2>
                <p className="text-xs text-slate-400 font-medium">Updating account for {editingUser.name}</p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="neu-circle w-8 h-8 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="neu-input w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    disabled={currentUser?.id === editingUser.id}
                    className="neu-input w-full cursor-pointer disabled:opacity-40"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Admin</option>
                  </select>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-[10px] text-amber-600 mt-1">Cannot demote yourself</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    disabled={currentUser?.id === editingUser.id}
                    className="neu-input w-full cursor-pointer disabled:opacity-40"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  {currentUser?.id === editingUser.id && (
                    <p className="text-[10px] text-amber-600 mt-1">Cannot disable yourself</p>
                  )}
                </div>
              </div>

              {/* Dynamic student fields in edit */}
              {editForm.role === "student" && (
                <div className="neu-inset p-4 space-y-3">
                  <p className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">
                    Student Details
                  </p>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      value={editForm.admissionNo}
                      onChange={(e) => setEditForm({ ...editForm, admissionNo: e.target.value })}
                      className="neu-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Class</label>
                      <select
                        value={editForm.classId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, classId: e.target.value, sectionId: "" })
                        }
                        className="neu-input w-full cursor-pointer"
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Section</label>
                      <select
                        value={editForm.sectionId}
                        onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                        disabled={!selectedEditClass}
                        className="neu-input w-full cursor-pointer disabled:opacity-40"
                      >
                        <option value="">Select Section</option>
                        {selectedEditClass?.sections.map((s) => (
                          <option key={s} value={s}>
                            Section {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Linked Parent Information in Edit */}
                  <div className="border-t border-slate-200/80 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[11px] text-indigo-700 uppercase tracking-wider">
                        Connected Parent / Guardian
                      </p>
                      <span className="text-[10px] text-slate-400">Auto-Linked</span>
                    </div>

                    {allParents.length > 0 && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                          Select Parent
                        </label>
                        <select
                          value={editForm.parentId}
                          onChange={(e) => setEditForm({ ...editForm, parentId: e.target.value })}
                          className="neu-input w-full cursor-pointer text-xs"
                        >
                          <option value="">-- No parent linked / Or enter below --</option>
                          {allParents.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {!editForm.parentId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Parent Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Rajesh Sharma"
                            value={editForm.parentName}
                            onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                            className="neu-input w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1 text-[11px]">Parent Email</label>
                          <input
                            type="email"
                            placeholder="e.g. parent.sharma@learnmate.test"
                            value={editForm.parentEmail}
                            onChange={(e) => setEditForm({ ...editForm, parentEmail: e.target.value })}
                            className="neu-input w-full text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic parent fields in edit */}
              {editForm.role === "parent" && (
                <div className="neu-inset p-4 space-y-2">
                  <p className="font-extrabold text-[11px] text-slate-500 uppercase tracking-wider">
                    Linked Children
                  </p>
                  <select
                    multiple
                    value={editForm.childIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setEditForm({ ...editForm, childIds: selected });
                    }}
                    className="neu-input w-full h-28 cursor-pointer"
                  >
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="neu-btn px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPORARY PASSWORD ONE-TIME MODAL */}
      {tempPassModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="neu-card bg-[#f0f3f8] max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {tempPassModal.isReset ? "Password Reset Generated" : "Temporary Credentials"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">One-Time Display Warning</p>
              </div>
            </div>

            <div className="neu-inset p-3.5 text-xs text-amber-800 leading-relaxed">
              Copy this temporary password now. For security purposes, it will <strong>NOT</strong> be displayed again.
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-slate-500">
                Account: <strong className="text-slate-800">{tempPassModal.name}</strong> ({tempPassModal.email})
              </p>
              <div className="neu-inset p-3 flex items-center justify-between">
                <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                  {tempPassModal.tempPass}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tempPassModal.tempPass)}
                  className="neu-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-normal">
              The user will be required to change this password immediately upon their first login before accessing portal features.
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setTempPassModal({ ...tempPassModal, isOpen: false })}
                className="w-full neu-btn py-2.5 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                I Have Safely Copied The Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
