import React, { useMemo, useState } from "react";
import { error as logError } from "../utils/logger";
import { motion } from "framer-motion";
import { FaPen, FaSearch, FaEllipsisV, FaTimes } from "react-icons/fa";
import swal from "sweetalert";
import { authFetch } from "../scripts/AuthProvider";
import avatar from "../assets/useravatar.jpg";
import Spinner from "../loader/Spinner";

const MODAL_CLASSES = {
  backdrop: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
  content: "w-full max-w-md rounded-xl border border-[#444] bg-[#1e1e1e] p-6 shadow-xl",
  title: "mb-4 text-lg font-semibold text-white",
  formRow: "mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-center",
  formLabel: "w-full sm:w-28 shrink-0 text-sm font-medium text-gray-300",
  formInput:
    "flex-1 rounded-lg border border-[#555] bg-[#2e2e2e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#A294F9] focus:outline-none focus:ring-1 focus:ring-[#A294F9]",
  actions: "mt-6 flex justify-end gap-3",
};

const Settings = ({ openAddUserModal, setOpenAddUserModal }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [activityHistory, setActivityHistory] = useState([]);
  const [relations, setRelations] = useState({});
  const [loading, setLoading] = useState(true);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangePasswordModalForUser, setShowChangePasswordModalForUser] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState("User");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordUser, setNewPasswordUser] = useState("");
  const [confirmPasswordUser, setConfirmPasswordUser] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await authFetch("/admin/settings/", { method: "GET" });
      const data = await response.json();
      if (!response.ok) {
        logError("Settings API error:", data?.error || response.status);
        fetchProfileFallback();
        return;
      }
      setSettingsData(data);
    } catch (error) {
      logError("Error fetching settings data:", error);
      // When settings API fails (e.g. 400 org not found, 500), still try to show current user profile
      fetchProfileFallback();
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileFallback = async () => {
    try {
      const response = await authFetch("/getUserDetails/", { method: "GET" });
      const data = await response.json();
      if (!response.ok) return;
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
        data.username ||
        "";
      setUser({
        name,
        email: data.email ?? "",
        phone_number: data.contact ?? "",
        profile_img: data.profile_picture ?? null,
      });
    } catch (err) {
      logError("Fallback profile fetch failed:", err);
    }
  };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const setSettingsData = (data) => {
    // Profile: always set from top-level fields (API: user, email, phone, profile_picture)
    setUser({
      name: data.user ?? "",
      email: data.email ?? "",
      phone_number: data.phone ?? "",
      profile_img: data.profile_picture ?? null,
    });

    // Account manager: safe in case API returns error or missing relation
    const am = data.account_manager;
    setRelations({
      name: am ? [am.first_name, am.last_name].filter(Boolean).join(" ") || "" : "",
      email: am?.email ?? "",
      phone_number: am?.phone_number ?? "",
    });

    // Activity log and admin list: guard against missing or non-array
    const activityLogs = Array.isArray(data.activity_logs) ? data.activity_logs : [];
    setActivityHistory(
      activityLogs.map((entry) => ({
        id: entry.id,
        action: entry.details ?? "",
        time: entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "",
      }))
    );

    const adminUsers = Array.isArray(data.admin_users) ? data.admin_users : [];
    setUsers(
      adminUsers.map((admin) => ({
        id: admin.id,
        name: [admin.first_name, admin.last_name].filter(Boolean).join(" ") || "—",
        email: admin.email ?? "",
        phone: admin.contact || "N/A",
        role: admin.is_staff ? "Admin" : "Lecturer",
      }))
    );
  };

  const handleChangePasswordForUser = async () => {
    if (!newPasswordUser || !confirmPasswordUser) {
      swal("Error", "Please fill in all password fields", "error");
      return;
    }
    if (newPasswordUser !== confirmPasswordUser) {
      swal("Error", "New password and confirm password do not match", "error");
      return;
    }
    const data = {
      request_type: "change_admin_password",
      email: passwordUser.email,
      new_password: newPasswordUser,
    };
    const response = await authFetch("/admin/settings/update/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      swal("Error", "Failed to change password. Please try again.", "error");
      return;
    }
    swal("Success", "Password changed successfully", "success");
    // Clear password fields and close modal
    setNewPasswordUser("");
    setConfirmPasswordUser("");
    fetchSettings();
    setShowChangePasswordModalForUser(false);
  };

  // Function to create a new user (Add User modal) with validation
  const handleCreateUser = async () => {
    setIsCreatingUser(true);
    const errors = {};

    if (!newUserName.trim()) {
      errors.newUserName = "Name is required.";
    }
    if (!newUserEmail.trim()) {
      errors.newUserEmail = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserEmail)) {
        errors.newUserEmail = "Invalid email format.";
      }
    }
    if (!newUserPhone.trim()) {
      errors.newUserPhone = "Phone number is required.";
    } else {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(newUserPhone)) {
        errors.newUserPhone =
          "Phone number must be exactly 10 digits and only numbers.";
      }
    }

    if (Object.keys(errors).length > 0) {
      swal("Error", Object.values(errors).join("\n"), "error");
      setIsCreatingUser(false);
      return;
    }

    const newUserData = {
      request_type: "add_admin",
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
      password: newUserPassword,
    };

    try {
      const response = await authFetch("/admin/settings/update/", {
        method: "POST",
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        swal("Error", "Failed to create user. Please try again.", "error");
        setIsCreatingUser(false);
        return;
      }
      fetchSettings();
      swal("Success", "User created successfully", "success");
    } catch (error) {
      logError("Error creating user:", error);
      swal("Error", "Failed to create user. Please try again.", "error");
      setIsCreatingUser(false);
    }

    setOpenAddUserModal(false);

    // Clear form fields
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserRole("User");
    setNewUserPassword("");
    setIsCreatingUser(false);
  };

  const handleEditUser = (targetUser) => {
    setEditName(targetUser.name);
    setEditEmail(targetUser.email);
    setEditPhone(targetUser.phone);
    setEditRole(targetUser.role);
    setShowEditUserModal(true);
  };

  // Update user details from the Edit modal
  const handleUpdateUser = async () => {
    try {
      const response = await authFetch(`/admin/settings/update/`, {
        method: "POST",
        body: JSON.stringify({
          request_type: "edit_admin",
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
        }),
      });
      if (!response.ok) {
        swal("Error", "Failed to update user. Please try again.", "error");
        return;
      }
      swal("Success", "User updated successfully", "success");
    } catch (error) {
      logError("Error updating user:", error);
      swal("Error", "Failed to update user. Please try again.", "error");
    }
    fetchSettings();
    setEditName("");
    setEditEmail("");
    setEditPhone("");
    setEditRole("");
    setShowEditUserModal(false);
  };

  const handleDeleteUser = (userId) => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this user!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        const response = await authFetch(`/admin/settings/update/${userId}/`, {
          method: "DELETE",
        });
        if (!response.ok) {
          swal("Error", "Failed to delete user. Please try again.", "error");
          return;
        }
        swal("User has been deleted!", { icon: "success" });
        fetchSettings();
      }
    });
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      swal("Error", "Please fill in all password fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      swal("Error", "New password and confirm password do not match", "error");
      return;
    }
    try {
      const response = await authFetch("/admin/settings/update/", {
        method: "POST",
        body: JSON.stringify({
          request_type: "change_password",
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      if (!response.ok) {
        if (response.status === 400) {
          swal("Error", "Old password is incorrect", "error");
          return;
        }
        swal("Error", "Failed to change password. Please try again.", "error");
        return;
      }
      swal("Success", "Password changed successfully", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordModal(false);
    } catch (err) {
      logError("Change password error:", err);
      swal("Error", "Failed to change password. Please try again.", "error");
    }
  };

  const filteredUserData = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [searchQuery, users]);

  if (loading) return <Spinner className="min-h-[200px]" />;

  const { backdrop, content, title, formRow, formLabel, formInput, actions } = MODAL_CLASSES;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full max-w-full flex-col rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden">
        <h1 className="shrink-0 text-xl font-semibold text-white sm:text-2xl">
          Settings
        </h1>

        {/* Profile Card */}
        <div className="shrink-0 rounded-xl border border-[#5a5a5a] bg-[#333333] p-4 sm:p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Profile</h3>
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start lg:min-w-0 lg:flex-1">
              <div className="flex items-start gap-4">
                <img
                  src={user.profile_img || avatar}
                  alt="Profile"
                  className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Username</p>
                  <p className="truncate text-sm font-medium text-white">{user.name ?? "—"}</p>
                  <p className="mt-2 text-xs text-gray-400">Email</p>
                  <p className="truncate text-sm text-white">{user.email ?? "—"}</p>
                  <p className="mt-2 text-xs text-gray-400">Phone</p>
                  <p className="truncate text-sm text-white">{user.phone_number ?? "—"}</p>
                </div>
              </div>
              <div className="rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 lg:flex-1">
                <h5 className="mb-2 text-sm font-semibold text-white">Account Manager</h5>
                <p className="text-sm text-gray-300">Name: {relations.name ?? "—"}</p>
                <p className="mt-1 text-sm text-gray-300">Email: {relations.email ?? "—"}</p>
                <p className="mt-1 text-sm text-gray-300">Phone: {relations.phone_number ?? "—"}</p>
              </div>
            </div>
            <div className="flex min-h-0 flex-col rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 lg:w-80">
              <h5 className="mb-2 text-sm font-semibold text-white">Activity History</h5>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {activityHistory.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {activityHistory.map((activity) => (
                      <li key={activity.id} className="break-words">
                        {activity.action} — {activity.time}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No activity found</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="mt-3 w-full rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Manage Users */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="border-b-2 border-[#A294F9] pb-2 text-base font-semibold text-white">
              Manage Users
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex items-center">
                <FaSearch className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-[#555] bg-[#3a3a3a] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-[#A294F9] focus:outline-none sm:w-56"
                />
              </div>
              <motion.button
                whileTap={{ scale: 1.02 }}
                type="button"
                onClick={() => setOpenAddUserModal(true)}
                className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
              >
                Add User
              </motion.button>
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-[#5a5a5a] md:block">
            <table className="min-w-[640px] w-full border-collapse">
              <thead>
                <tr className="bg-[#535353]">
                  <th className="border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">#ID</th>
                  <th className="border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">Name</th>
                  <th className="border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">Email</th>
                  <th className="border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">Phone</th>
                  <th className="border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">Role</th>
                  <th className="border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserData.length > 0 ? (
                  filteredUserData.map((u, index) => (
                    <tr
                      key={u.id}
                      className={`border-b border-[#555] hover:bg-[#404040] ${
                        index % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-white">{u.id}</td>
                      <td className="px-4 py-3 text-sm text-white">{u.name}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-sm text-white">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-white">{u.phone}</td>
                      <td className="px-4 py-3 text-sm text-white">{u.role}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-[#555] hover:text-white"
                            aria-label="Actions"
                          >
                            <FaEllipsisV className="text-lg" />
                          </button>
                          {openMenuId === u.id && (
                            <ul className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[#555] bg-[#2a2a2a] py-1 shadow-xl">
                              <li>
                                <button
                                  type="button"
                                  onClick={() => { handleEditUser(u); setOpenMenuId(null); }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-[#404040]"
                                >
                                  <FaPen className="text-xs" /> Edit
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  onClick={() => { setPasswordUser(u); setShowChangePasswordModalForUser(true); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#404040]"
                                >
                                  Change Password
                                </button>
                              </li>
                              <li>
                                <button
                                  type="button"
                                  onClick={() => { handleDeleteUser(u.id); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#404040]"
                                >
                                  Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: user cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredUserData.length > 0 ? (
              filteredUserData.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-xs text-gray-400">#{u.id} · {u.role}</p>
                    </div>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="rounded p-2 text-gray-400 hover:bg-[#555] hover:text-white"
                        aria-label="Actions"
                      >
                        <FaEllipsisV />
                      </button>
                      {openMenuId === u.id && (
                        <ul className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[#555] bg-[#2a2a2a] py-1 shadow-xl">
                          <li>
                            <button type="button" onClick={() => { handleEditUser(u); setOpenMenuId(null); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-[#404040]">
                              <FaPen className="text-xs" /> Edit
                            </button>
                          </li>
                          <li>
                            <button type="button" onClick={() => { setPasswordUser(u); setShowChangePasswordModalForUser(true); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#404040]">
                              Change Password
                            </button>
                          </li>
                          <li>
                            <button type="button" onClick={() => { handleDeleteUser(u.id); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#404040]">
                              Delete
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 truncate text-sm text-gray-300">{u.email}</p>
                  <p className="text-sm text-gray-300">{u.phone}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] py-8 text-center text-sm text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Add User Modal */}
        {openAddUserModal && (
          <div className={backdrop} onClick={() => setOpenAddUserModal(false)}>
            <div className={content} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className={title}>Add User</h2>
                <button type="button" onClick={() => setOpenAddUserModal(false)} className="rounded p-1.5 text-gray-400 hover:bg-[#404040] hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <div className={formRow}>
                <label className={formLabel}>Name</label>
                <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Enter name" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Email</label>
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Enter email" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Phone</label>
                <input type="text" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)} placeholder="Enter phone" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Password</label>
                <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Enter password" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className={formInput}>
                  <option value="Admin">Admin</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
              <div className={actions}>
                <button type="button" onClick={() => setOpenAddUserModal(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleCreateUser} disabled={isCreatingUser} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8] disabled:opacity-60">
                  {isCreatingUser ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && (
          <div className={backdrop} onClick={() => setShowEditUserModal(false)}>
            <div className={content} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className={title}>Edit User</h2>
                <button type="button" onClick={() => setShowEditUserModal(false)} className="rounded p-1.5 text-gray-400 hover:bg-[#404040] hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <div className={formRow}>
                <label className={formLabel}>Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Email</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Phone</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={formInput}>
                  <option value="Admin">Admin</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
              <div className={actions}>
                <button type="button" onClick={() => setShowEditUserModal(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleUpdateUser} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password (self) Modal */}
        {showChangePasswordModal && (
          <div className={backdrop} onClick={() => setShowChangePasswordModal(false)}>
            <div className={content} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className={title}>Change Password</h2>
                <button type="button" onClick={() => setShowChangePasswordModal(false)} className="rounded p-1.5 text-gray-400 hover:bg-[#404040] hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <div className={formRow}>
                <label className={formLabel}>Old Password</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter old password" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Confirm</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={formInput} />
              </div>
              <div className={actions}>
                <button type="button" onClick={() => setShowChangePasswordModal(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleChangePassword} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password (for user) Modal */}
        {showChangePasswordModalForUser && passwordUser && (
          <div className={backdrop} onClick={() => setShowChangePasswordModalForUser(false)}>
            <div className={content} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className={title}>Change Password — {passwordUser.name}</h2>
                <button type="button" onClick={() => setShowChangePasswordModalForUser(false)} className="rounded p-1.5 text-gray-400 hover:bg-[#404040] hover:text-white">
                  <FaTimes />
                </button>
              </div>
              <div className={formRow}>
                <label className={formLabel}>New Password</label>
                <input type="password" value={newPasswordUser} onChange={(e) => setNewPasswordUser(e.target.value)} placeholder="Enter new password" className={formInput} />
              </div>
              <div className={formRow}>
                <label className={formLabel}>Confirm</label>
                <input type="password" value={confirmPasswordUser} onChange={(e) => setConfirmPasswordUser(e.target.value)} placeholder="Confirm new password" className={formInput} />
              </div>
              <div className={actions}>
                <button type="button" onClick={() => setShowChangePasswordModalForUser(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleChangePasswordForUser} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Settings;
