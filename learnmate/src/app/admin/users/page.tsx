"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
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
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/users?${query.toString()}`);
      setUsers(res.users);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassOptions = async () => {
    try {
      const res = await api.get<{ classes: any[] }>("/api/admin/classes");
      setClasses(res.classes || []);
      const stuRes = await api.get<{ users: any[] }>("/api/admin/users?role=student&limit=100");
      setAllStudents(stuRes.users || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    fetchClassOptions();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Create User Submit
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
        payload.classId = addForm.classId || null;
        payload.sectionId = addForm.sectionId || null;
      } else if (addForm.role === "parent") {
        payload.childIds = addForm.childIds;
      }

      const res = await api.post<{ user: UserItem; temporaryPassword: string }>(
        "/api/admin/users",
        payload
      );

      toast(`User ${res.user.name} created successfully.`);
      setIsAddOpen(false);
      setAddForm({
        name: "",
        email: "",
        role: "student",
        status: "active",
        admissionNo: "",
        classId: "",
        sectionId: "",
        childIds: [],
      });

      // Show temporary password modal
      setTempPassModal({
        isOpen: true,
        name: res.user.name,
        email: res.user.email,
        tempPass: res.temporaryPassword,
        isReset: false,
      });

      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to create user", "error");
    }
  };

  // Open Edit Modal
  const openEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      admissionNo: u.admissionNo || "",
      classId: u.classId || "",
      sectionId: u.sectionId || "",
      childIds: u.childIds ? u.childIds.map((c) => (typeof c === "object" ? c._id || c.id : c)) : [],
    });
    setIsEditOpen(true);
  };

  // Edit User Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.patch(`/api/admin/users/${editingUser.id}`, editForm);
      toast(`User ${editForm.name} updated successfully.`);
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to update user", "error");
    }
  };

  // Reset Password Action
  const handleResetPassword = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to reset the password for ${u.name}?`)) return;

    try {
      const res = await api.post<{ temporaryPassword: string }>(
        `/api/admin/users/${u.id}/reset-password`
      );
      toast(`Password for ${u.name} has been reset.`);
      setTempPassModal({
        isOpen: true,
        name: u.name,
        email: u.email,
        tempPass: res.temporaryPassword,
        isReset: true,
      });
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Failed to reset password", "error");
    }
  };

  // Disable / Enable User
  const toggleUserStatus = async (u: UserItem) => {
    const isDisabling = u.status === "active";
    const endpoint = isDisabling
      ? `/api/admin/users/${u.id}/disable`
      : `/api/admin/users/${u.id}/enable`;

    try {
      await api.post(endpoint);
      toast(`User ${u.name} is now ${isDisabling ? "disabled" : "active"}.`);
      fetchUsers();
    } catch (err: any) {
      toast(err.message || "Action failed", "error");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassModal.tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedClass = classes.find((c) => c.id === addForm.classId);
  const selectedEditClass = classes.find((c) => c.id === editForm.classId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage school user accounts, assign roles, set credentials, and govern access status.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus size={15} />
          <span>Add New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
            <option value="coordinator">Coordinator</option>
            <option value="teacher">Teacher</option>
            <option value="counsellor">Counsellor</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[11px]">
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
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading directory entries...</span>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-[11px] font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
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

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Reset Temporary Password"
                          >
                            <KeyRound size={14} />
                          </button>

                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSelf
                                ? "text-slate-300 cursor-not-allowed"
                                : u.status === "active"
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              isSelf
                                ? "Cannot disable your own account"
                                : u.status === "active"
                                ? "Disable User"
                                : "Enable User"
                            }
                          >
                            {u.status === "active" ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {users.length} of {total} registered users
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Provision New User Account</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meera Krishnan"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. meera@school.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="principal">Principal</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Dynamic student fields */}
              {addForm.role === "student" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                    Student Information
                  </p>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      placeholder="e.g. ADM-2026-042"
                      value={addForm.admissionNo}
                      onChange={(e) => setAddForm({ ...addForm, admissionNo: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Class</label>
                      <select
                        value={addForm.classId}
                        onChange={(e) =>
                          setAddForm({ ...addForm, classId: e.target.value, sectionId: "" })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900"
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
                      <label className="block font-medium text-slate-700 mb-1">Section</label>
                      <select
                        value={addForm.sectionId}
                        onChange={(e) => setAddForm({ ...addForm, sectionId: e.target.value })}
                        disabled={!selectedClass}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 disabled:opacity-40"
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
                </div>
              )}

              {/* Dynamic parent fields */}
              {addForm.role === "parent" && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                    Link Children (Students)
                  </p>
                  <select
                    multiple
                    value={addForm.childIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                      setAddForm({ ...addForm, childIds: selected });
                    }}
                    className="w-full h-24 px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-900"
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Create &amp; Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit User Details</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    disabled={currentUser?.id === editingUser.id}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:opacity-50"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="principal">Principal</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    disabled={currentUser?.id === editingUser.id}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {editForm.role === "student" && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Admission Number</label>
                    <input
                      type="text"
                      value={editForm.admissionNo}
                      onChange={(e) => setEditForm({ ...editForm, admissionNo: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Class</label>
                      <select
                        value={editForm.classId}
                        onChange={(e) =>
                          setEditForm({ ...editForm, classId: e.target.value, sectionId: "" })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900"
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
                      <label className="block font-medium text-slate-700 mb-1">Section</label>
                      <select
                        value={editForm.sectionId}
                        onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                        disabled={!selectedEditClass}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 disabled:opacity-40"
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
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Password Display Modal */}
      {tempPassModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {tempPassModal.isReset ? "Password Reset Successfully" : "Account Provisioned"}
                </h3>
                <p className="text-xs text-slate-500">
                  Temporary credentials for <strong>{tempPassModal.name}</strong> ({tempPassModal.email})
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Important:</strong> This temporary password will <strong>NOT</strong> be displayed again. Please copy and provide it to the user now. They will be forced to change it upon first login.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Generated Temporary Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 select-all">
                  {tempPassModal.tempPass}
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copied
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setTempPassModal({ ...tempPassModal, isOpen: false })}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                I Have Copied The Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
