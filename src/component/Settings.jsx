import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { error as logError } from "../utils/logger";
import { motion } from "framer-motion";
import {
  FaPen,
  FaSearch,
  FaEllipsisV,
  FaTimes,
  FaSitemap,
  FaTable,
  FaChevronDown,
  FaChevronUp,
  FaShieldAlt,
  FaCodeBranch,
  FaInfoCircle,
} from "react-icons/fa";
import swal from "sweetalert";
import { authFetch, getCachedSettingsDetails, setCachedSettingsDetails } from "../scripts/AuthProvider";
import avatar from "../assets/useravatar.jpg";
import Spinner from "../loader/Spinner";

const MODAL_CLASSES = {
  /** Above sidebar / mobile drawer (z-1000) so dialogs are not trapped in the scroll pane */
  backdrop:
    "fixed inset-0 z-[10050] flex items-center justify-center bg-black/60 p-4",
  content: "w-full max-w-md rounded-xl border border-[#444] bg-[#1e1e1e] p-6 shadow-xl",
  title: "mb-4 text-lg font-semibold text-white",
  formRow: "mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-center",
  formLabel: "w-full sm:w-28 shrink-0 text-sm font-medium text-gray-300",
  formInput:
    "flex-1 rounded-lg border border-[#555] bg-[#2e2e2e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#A294F9] focus:outline-none focus:ring-1 focus:ring-[#A294F9]",
  actions: "mt-6 flex justify-end gap-3",
};

/** Info icon with theme-matched tooltip (hover + keyboard focus).
 *  Tooltip is anchored at the icon's left edge and grows rightward so it is not clipped by
 *  overflow-x-hidden ancestors (avoid right-edge anchoring on a narrow trigger). */
function InfoTooltip({ label, children }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#5a5a5a] bg-[#3a3a3a] text-[#b4a9f5] transition-colors hover:border-[#A294F9]/55 hover:bg-[#404040] hover:text-[#ddd6fe] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A294F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#282828]"
        aria-label={label}
      >
        <FaInfoCircle className="h-3 w-3" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-[100] mt-2 w-max max-w-[min(20rem,calc(100vw-2rem))] break-words rounded-lg border border-[#555] bg-[#2a2a2a] px-3 py-2.5 text-left text-xs leading-relaxed text-gray-300 shadow-xl ring-1 ring-black/30 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}

/** Role label + theme tooltip (organization admin vs branch coordinator) */
function RoleWithInfoTooltip({ role, accessLevel }) {
  const isBranch = accessLevel === "branch";
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <span className="min-w-0 shrink">{role}</span>
      <InfoTooltip
        label={isBranch ? "Branch coordinator access" : "Organization admin access"}
      >
        <span className="text-gray-300">
          {isBranch ? (
            <>
              Branch coordinators only see students, exams, and results for the branches assigned to
              them.
            </>
          ) : (
            <>
              Organization admins have full access: all branches, exams, results, and panel user
              management.
            </>
          )}
        </span>
      </InfoTooltip>
    </span>
  );
}

/** Card for hierarchy view: tiered org / branch panel users */
function OrgUserHierarchyCard({
  u,
  expanded,
  onToggleExpand,
  onEdit,
  onPassword,
  onDelete,
  currentUserEmail,
  tier,
}) {
  const isOrg = tier === "org";
  return (
    <div
      className={`rounded-xl border bg-[#353535] transition-shadow ${
        isOrg ? "border-[#A294F9]/40" : "border-sky-500/35"
      } ${expanded ? "ring-1 ring-white/10" : ""}`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-start justify-between gap-2 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{u.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">{u.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                isOrg
                  ? "bg-[#A294F9]/25 text-[#ddd6fe]"
                  : "bg-sky-500/20 text-sky-200"
              }`}
            >
              {isOrg ? "Org admin" : "Branch coordinator"}
            </span>
            {u.isActive === false && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300">
                Inactive
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <FaChevronUp className="mt-1 shrink-0 text-gray-400" />
        ) : (
          <FaChevronDown className="mt-1 shrink-0 text-gray-400" />
        )}
      </button>
      {!isOrg && (
        <div className="flex flex-wrap gap-1 border-t border-[#444] px-4 pb-3 pt-2">
          {(u.branchDetail || []).length > 0 ? (
            (u.branchDetail || []).map((b) => (
              <span
                key={b.id}
                className="rounded-md bg-[#404040] px-2 py-0.5 text-[11px] text-gray-200"
              >
                {b.name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-amber-400/90">No branches assigned - edit to fix</span>
          )}
        </div>
      )}
      {isOrg && (
        <div className="border-t border-[#444] px-4 pb-3 pt-2 text-xs text-gray-500">
          Full access: all branches, exams, results, and panel user management.
        </div>
      )}
      {expanded && (
        <div className="border-t border-[#444] px-4 py-3">
          <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-200">{u.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">User ID</dt>
              <dd className="text-gray-200">{u.id}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Email</dt>
              <dd className="break-all text-gray-200">{u.email}</dd>
            </div>
            {u.createdAt && (
              <div>
                <dt className="text-gray-500">Panel since</dt>
                <dd className="text-gray-200">{u.createdAt}</dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded-lg bg-[#A294F9] px-3 py-2 text-xs font-medium text-white hover:bg-[#8b7ce8]"
            >
              Adjust access
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPassword();
              }}
              className="rounded-lg border border-[#555] bg-[#404040] px-3 py-2 text-xs font-medium text-white hover:bg-[#4a4a4a]"
            >
              Set password
            </button>
            <button
              type="button"
              disabled={u.email === currentUserEmail}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-lg border border-red-500/40 bg-transparent px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Remove user
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [newUserRole, setNewUserRole] = useState("Admin");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserBranchIds, setNewUserBranchIds] = useState([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [viewerIsFullOrgAdmin, setViewerIsFullOrgAdmin] = useState(true);
  const [organizationGroups, setOrganizationGroups] = useState([]);

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBranchIds, setEditBranchIds] = useState([]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordUser, setNewPasswordUser] = useState("");
  const [confirmPasswordUser, setConfirmPasswordUser] = useState("");

  /** 'hierarchy' = tiered org chart style; 'table' = compact data table */
  const [orgPanelView, setOrgPanelView] = useState("hierarchy");
  const [expandedOrgUserId, setExpandedOrgUserId] = useState(null);

  const fetchSettings = async (updateCache = true, backgroundRefresh = false) => {
    if (!backgroundRefresh) setLoading(true);
    try {
      const response = await authFetch("/admin/settings/", { method: "GET" });
      const data = await response.json();
      if (!response.ok) {
        logError("Settings API error:", data?.error || response.status);
        if (!backgroundRefresh) fetchProfileFallback();
        return;
      }
      setSettingsData(data);
      if (updateCache) setCachedSettingsDetails(data);
    } catch (error) {
      logError("Error fetching settings data:", error);
      if (!backgroundRefresh) fetchProfileFallback();
    } finally {
      if (!backgroundRefresh) setLoading(false);
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
    const cached = getCachedSettingsDetails();
    if (cached) {
      setSettingsData(cached);
      setLoading(false);
      fetchSettings(true, true);
    } else {
      fetchSettings(true, false);
    }
  }, []);

  /** Portaled modals sit on body; lock page scroll so the main pane does not show a second scrollbar. */
  const anyPortalModalOpen =
    openAddUserModal ||
    showEditUserModal ||
    showChangePasswordModal ||
    showChangePasswordModalForUser;

  React.useEffect(() => {
    if (!anyPortalModalOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [anyPortalModalOpen]);

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
    setViewerIsFullOrgAdmin(data.viewer_is_full_org_admin !== false);
    setOrganizationGroups(Array.isArray(data.organization_groups) ? data.organization_groups : []);
    setUsers(
      adminUsers.map((admin) => ({
        id: admin.id,
        name: [admin.first_name, admin.last_name].filter(Boolean).join(" ") || "-",
        email: admin.email ?? "",
        phone: admin.contact || "N/A",
        role:
          admin.admin_panel_access_level === "branch"
            ? "Branch coordinator"
            : "Organization admin",
        accessLevel: admin.admin_panel_access_level || "full",
        branchIds: (admin.admin_panel_groups_detail || []).map((g) => g.id),
        branchDetail: admin.admin_panel_groups_detail || [],
        branchSummary:
          (admin.admin_panel_groups_detail || []).map((g) => g.name).join(", ") || "-",
        createdAt: admin.created_at
          ? new Date(admin.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : null,
        isActive: admin.is_active !== false,
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

    if (newUserRole === "Lecturer" && newUserBranchIds.length === 0) {
      swal("Error", "Select at least one branch for a branch coordinator.", "error");
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
      group_ids: newUserBranchIds,
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
    setNewUserRole("Admin");
    setNewUserPassword("");
    setNewUserBranchIds([]);
    setIsCreatingUser(false);
  };

  const handleEditUser = (targetUser) => {
    setEditName(targetUser.name);
    setEditEmail(targetUser.email);
    setEditPhone(targetUser.phone);
    setEditRole(targetUser.role === "Branch coordinator" ? "Lecturer" : "Admin");
    setEditBranchIds(targetUser.branchIds ? [...targetUser.branchIds] : []);
    setShowEditUserModal(true);
  };

  // Update user details from the Edit modal
  const handleUpdateUser = async () => {
    if (
      viewerIsFullOrgAdmin &&
      editEmail !== user.email &&
      editRole === "Lecturer" &&
      editBranchIds.length === 0
    ) {
      swal("Error", "Select at least one branch for a branch coordinator.", "error");
      return;
    }
    try {
      const payload = {
        request_type: "edit_admin",
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
      };
      if (viewerIsFullOrgAdmin && editEmail !== user.email) {
        payload.access_level = editRole === "Lecturer" ? "branch" : "full";
        payload.group_ids = editBranchIds;
      }
      const response = await authFetch(`/admin/settings/update/`, {
        method: "POST",
        body: JSON.stringify(payload),
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
    setEditBranchIds([]);
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
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.branchSummary && u.branchSummary.toLowerCase().includes(q))
    );
  }, [searchQuery, users]);

  const orgAdminUsers = useMemo(
    () => filteredUserData.filter((u) => u.accessLevel !== "branch"),
    [filteredUserData]
  );

  const branchCoordinatorUsers = useMemo(
    () => filteredUserData.filter((u) => u.accessLevel === "branch"),
    [filteredUserData]
  );

  const branchCoverageRows = useMemo(() => {
    return organizationGroups.map((g) => ({
      id: g.id,
      name: g.name,
      coordinators: branchCoordinatorUsers
        .filter((u) => u.branchIds.includes(g.id))
        .map((u) => u.name),
    }));
  }, [organizationGroups, branchCoordinatorUsers]);

  if (loading) return <Spinner className="min-h-[200px]" />;

  const { backdrop, content, title, formRow, formLabel, formInput, actions } = MODAL_CLASSES;

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col overflow-x-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8">
      <div className="flex min-w-0 max-w-full flex-col gap-5 pb-6 sm:pb-8">
        <h1 className="shrink-0 text-xl font-semibold text-white sm:text-2xl">
          Settings
        </h1>

        {/* Profile Card */}
        <div className="min-w-0 shrink-0 rounded-xl border border-[#5a5a5a] bg-[#333333] p-4 sm:p-5">
          <h3 className="mb-4 text-lg font-semibold text-white">Profile</h3>
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start lg:flex-1">
              <div className="flex items-start gap-4">
                <img
                  src={user.profile_img || avatar}
                  alt="Profile"
                  className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Username</p>
                  <p className="truncate text-sm font-medium text-white">{user.name ?? "-"}</p>
                  <p className="mt-2 text-xs text-gray-400">Email</p>
                  <p className="truncate text-sm text-white">{user.email ?? "-"}</p>
                  <p className="mt-2 text-xs text-gray-400">Phone</p>
                  <p className="truncate text-sm text-white">{user.phone_number ?? "-"}</p>
                </div>
              </div>
              <div className="min-w-0 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 lg:flex-1">
                <h5 className="mb-2 text-sm font-semibold text-white">Account Manager</h5>
                <p className="text-sm text-gray-300">Name: {relations.name ?? "-"}</p>
                <p className="mt-1 text-sm text-gray-300">Email: {relations.email ?? "-"}</p>
                <p className="mt-1 text-sm text-gray-300">Phone: {relations.phone_number ?? "-"}</p>
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 shrink-0 flex-col rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 lg:w-80 lg:max-w-full">
              <h5 className="mb-2 text-sm font-semibold text-white">Activity History</h5>
              <div className="min-h-0 flex-1 overflow-y-auto max-h-[140px]" style={{ height: "140px" }}>
                {activityHistory.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-gray-300">
                    {activityHistory.map((activity) => (
                      <li key={activity.id} className="break-words">
                        {activity.action} - {activity.time}
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

        {/* Manage Users - full org admins only */}
        {viewerIsFullOrgAdmin ? (
        <div className="flex min-h-0 min-w-0 max-w-full flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#A294F9] pb-2">
                <h2 className="min-w-0 text-base font-semibold text-white">
                  Organizational access & hierarchy
                </h2>
                <InfoTooltip label="About organizational access and roles">
                  <span className="block text-gray-300">
                    <strong className="font-semibold text-gray-200">Organization admins</strong> manage the
                    whole institution.{" "}
                    <strong className="font-semibold text-gray-200">Branch coordinators</strong> only see
                    students, exams, and results for the branches you assign. Use the branch coverage map to
                    verify each branch has the right owners.
                  </span>
                </InfoTooltip>
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:w-auto lg:max-w-full">
              <div className="flex shrink-0 rounded-lg border border-[#555] bg-[#2a2a2a] p-0.5">
                <button
                  type="button"
                  onClick={() => setOrgPanelView("hierarchy")}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium sm:text-sm ${
                    orgPanelView === "hierarchy"
                      ? "bg-[#A294F9] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaSitemap className="text-sm" /> Hierarchy
                </button>
                <button
                  type="button"
                  onClick={() => setOrgPanelView("table")}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium sm:text-sm ${
                    orgPanelView === "table"
                      ? "bg-[#A294F9] text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaTable className="text-sm" /> Table
                </button>
              </div>
              <div className="relative flex min-w-0 flex-1 items-center sm:min-w-[12rem] sm:max-w-md">
                <FaSearch className="pointer-events-none absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users or branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-w-0 rounded-lg border border-[#555] bg-[#3a3a3a] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-[#A294F9] focus:outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 1.02 }}
                type="button"
                onClick={() => setOpenAddUserModal(true)}
                className="shrink-0 rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
              >
                Add panel user
              </motion.button>
            </div>
          </div>

          {orgPanelView === "hierarchy" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-3">
                  <p className="text-xs text-gray-400">Organization admins</p>
                  <p className="text-xl font-semibold text-white">{orgAdminUsers.length}</p>
                </div>
                <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-3">
                  <p className="text-xs text-gray-400">Branch coordinators</p>
                  <p className="text-xl font-semibold text-white">{branchCoordinatorUsers.length}</p>
                </div>
                <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-3">
                  <p className="text-xs text-gray-400">Branches defined</p>
                  <p className="text-xl font-semibold text-white">{organizationGroups.length}</p>
                </div>
                <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-3">
                  <p className="text-xs text-gray-400">Panel users (total)</p>
                  <p className="text-xl font-semibold text-white">{filteredUserData.length}</p>
                </div>
              </div>

              {/* Tier 1 */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#c4b5fd]">
                  <FaShieldAlt className="text-base" />
                  <span>Level 1 - Full organization access</span>
                </div>
                <div className="ml-0 border-l-2 border-[#A294F9]/50 pl-4 md:ml-2">
                  {orgAdminUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">No organization admins match your search.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {orgAdminUsers.map((u) => (
                        <OrgUserHierarchyCard
                          key={u.id}
                          u={u}
                          expanded={expandedOrgUserId === u.id}
                          onToggleExpand={() =>
                            setExpandedOrgUserId((id) => (id === u.id ? null : u.id))
                          }
                          onEdit={() => handleEditUser(u)}
                          onPassword={() => {
                            setPasswordUser(u);
                            setShowChangePasswordModalForUser(true);
                          }}
                          onDelete={() => handleDeleteUser(u.id)}
                          currentUserEmail={user.email}
                          tier="org"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tier 2 */}
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#93c5fd]">
                  <FaCodeBranch className="text-base" />
                  <span>Level 2 - Branch coordinators (scoped access)</span>
                </div>
                <div className="ml-0 border-l-2 border-sky-500/40 pl-4 md:ml-2">
                  {branchCoordinatorUsers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No branch coordinators yet. Add a panel user and choose &quot;Branch coordinator&quot; with at least one branch.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {branchCoordinatorUsers.map((u) => (
                        <OrgUserHierarchyCard
                          key={u.id}
                          u={u}
                          expanded={expandedOrgUserId === u.id}
                          onToggleExpand={() =>
                            setExpandedOrgUserId((id) => (id === u.id ? null : u.id))
                          }
                          onEdit={() => handleEditUser(u)}
                          onPassword={() => {
                            setPasswordUser(u);
                            setShowChangePasswordModalForUser(true);
                          }}
                          onDelete={() => handleDeleteUser(u.id)}
                          currentUserEmail={user.email}
                          tier="branch"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Branch coverage map */}
              {organizationGroups.length > 0 && (
                <div className="rounded-xl border border-[#5a5a5a] bg-[#333333] p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Branch coverage map</h3>
                    <InfoTooltip label="How to read the branch coverage map">
                      <span className="text-gray-300">
                        Each row is a branch in your organization. Coordinators listed here can manage that
                        branch. Empty rows mean no coordinator is assigned yet-add one so the branch is
                        covered.
                      </span>
                    </InfoTooltip>
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-[#444]">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="sticky top-0 bg-[#3d3d3d]">
                        <tr>
                          <th className="border-b border-[#555] px-3 py-2 font-medium text-gray-300">Branch</th>
                          <th className="border-b border-[#555] px-3 py-2 font-medium text-gray-300">Coordinators</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchCoverageRows.map((row) => (
                          <tr key={row.id} className="border-b border-[#404040] bg-[#2f2f2f]/80">
                            <td className="px-3 py-2 font-medium text-white">{row.name}</td>
                            <td className="px-3 py-2 text-gray-300">
                              {row.coordinators.length > 0
                                ? row.coordinators.join(", ")
                                : <span className="text-amber-400/90">No coordinator assigned</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop: table - w-full + table-fixed avoids extra horizontal gutter next to the last column */}
          <div
            className={`hidden w-full min-w-0 max-w-full md:block ${orgPanelView !== "table" ? "md:hidden" : ""}`}
          >
            <div className="w-full min-w-0 rounded-lg border border-[#5a5a5a]">
              <table className="w-full min-w-0 table-fixed border-collapse">
              <thead>
                <tr className="bg-[#535353]">
                  <th className="w-14 border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    #ID
                  </th>
                  <th className="w-[14%] border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    Name
                  </th>
                  <th className="w-[26%] border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    Email
                  </th>
                  <th className="w-[12%] border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    Phone
                  </th>
                  <th className="w-[20%] border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    <span className="inline-flex items-center gap-1.5">
                      Role
                      <InfoTooltip label="Panel user roles">
                        <span className="text-gray-300">
                          <strong className="font-semibold text-gray-200">Organization admin</strong> - full
                          institution access.{" "}
                          <strong className="font-semibold text-gray-200">Branch coordinator</strong> - scoped
                          to assigned branches only.
                        </span>
                      </InfoTooltip>
                    </span>
                  </th>
                  <th className="w-[18%] border-b border-[#666] px-2 py-3 text-left text-sm font-medium text-white">
                    <span className="inline-flex items-center gap-1.5">
                      Branches
                      <InfoTooltip label="Branches column">
                        <span className="text-gray-300">
                          Branches this user can manage. Organization admins effectively cover all branches
                          (shown as -). Coordinators list their assigned branches.
                        </span>
                      </InfoTooltip>
                    </span>
                  </th>
                  <th className="w-24 border-b border-[#666] px-2 py-3 text-center text-sm font-medium text-white">
                    Actions
                  </th>
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
                      <td className="px-2 py-3 text-sm text-white">{u.id}</td>
                      <td className="min-w-0 truncate px-2 py-3 text-sm text-white" title={u.name}>
                        {u.name}
                      </td>
                      <td className="min-w-0 truncate px-2 py-3 text-sm text-white" title={u.email}>
                        {u.email}
                      </td>
                      <td className="min-w-0 truncate px-2 py-3 text-sm text-white" title={u.phone}>
                        {u.phone}
                      </td>
                      <td className="min-w-0 px-2 py-3 text-sm text-white align-middle">
                        <RoleWithInfoTooltip role={u.role} accessLevel={u.accessLevel} />
                      </td>
                      <td
                        className="min-w-0 truncate px-2 py-3 text-xs text-gray-300"
                        title={u.branchSummary}
                      >
                        {u.branchSummary}
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
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
                                  disabled={u.email === user.email}
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
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile: user cards (table mode only; hierarchy uses cards above) */}
          <div className={`flex flex-col gap-3 md:hidden ${orgPanelView !== "table" ? "hidden" : ""}`}>
            {filteredUserData.length > 0 ? (
              filteredUserData.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="mt-0.5 inline-flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                        <span>#{u.id} ·</span>
                        <RoleWithInfoTooltip role={u.role} accessLevel={u.accessLevel} />
                      </p>
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
                            <button type="button" onClick={() => { handleDeleteUser(u.id); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[#404040]" disabled={u.email === user.email}>
                              Delete
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 truncate text-sm text-gray-300">{u.email}</p>
                  <p className="text-sm text-gray-300">{u.phone}</p>
                  <p className="mt-1 text-xs text-gray-500">Branches: {u.branchSummary}</p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] py-8 text-center text-sm text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>
        ) : (
          <p className="text-sm text-gray-400">
            Panel user and branch access is managed by your organization administrator. You can still update your profile and password above.
          </p>
        )}

        {/* Add User Modal - portal keeps overlay above layout / scroll regions */}
        {openAddUserModal &&
          typeof document !== "undefined" &&
          createPortal(
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
                <select
                  value={newUserRole}
                  onChange={(e) => {
                    setNewUserRole(e.target.value);
                    if (e.target.value === "Admin") setNewUserBranchIds([]);
                  }}
                  className={formInput}
                >
                  <option value="Admin">Organization admin (all branches)</option>
                  <option value="Lecturer">Branch coordinator</option>
                </select>
              </div>
              {newUserRole === "Lecturer" && (
                <div className={formRow}>
                  <label className={formLabel}>Branches</label>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {organizationGroups.length > 0 ? (
                      <div className="max-h-[220px] w-full space-y-0.5 overflow-y-auto rounded-lg border border-[#555] bg-[#2e2e2e] p-2">
                        {organizationGroups.map((g) => (
                          <label
                            key={g.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white hover:bg-[#404040]"
                          >
                            <input
                              type="checkbox"
                              checked={newUserBranchIds.includes(g.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUserBranchIds((prev) =>
                                    prev.includes(g.id) ? prev : [...prev, g.id]
                                  );
                                } else {
                                  setNewUserBranchIds((prev) => prev.filter((id) => id !== g.id));
                                }
                              }}
                              className="h-4 w-4 shrink-0 rounded border-[#555] bg-[#353535] text-[#A294F9] accent-[#A294F9] focus:ring-1 focus:ring-[#A294F9]"
                            />
                            <span className="min-w-0">{g.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-400/90">No branches available.</p>
                    )}
                  </div>
                </div>
              )}
              <div className={actions}>
                <button type="button" onClick={() => setOpenAddUserModal(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleCreateUser} disabled={isCreatingUser} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8] disabled:opacity-60">
                  {isCreatingUser ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Edit User Modal */}
        {showEditUserModal &&
          typeof document !== "undefined" &&
          createPortal(
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
              {viewerIsFullOrgAdmin && editEmail !== user.email && (
                <>
                  <div className={formRow}>
                    <label className={formLabel}>Role</label>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className={formInput}>
                      <option value="Admin">Organization admin (all branches)</option>
                      <option value="Lecturer">Branch coordinator</option>
                    </select>
                  </div>
                  {editRole === "Lecturer" && (
                    <div className={formRow}>
                      <label className={formLabel}>Branches</label>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {organizationGroups.length > 0 ? (
                          <div className="max-h-[220px] w-full space-y-0.5 overflow-y-auto rounded-lg border border-[#555] bg-[#2e2e2e] p-2">
                            {organizationGroups.map((g) => (
                              <label
                                key={g.id}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white hover:bg-[#404040]"
                              >
                                <input
                                  type="checkbox"
                                  checked={editBranchIds.includes(g.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditBranchIds((prev) =>
                                        prev.includes(g.id) ? prev : [...prev, g.id]
                                      );
                                    } else {
                                      setEditBranchIds((prev) =>
                                        prev.filter((id) => id !== g.id)
                                      );
                                    }
                                  }}
                                  className="h-4 w-4 shrink-0 rounded border-[#555] bg-[#353535] text-[#A294F9] accent-[#A294F9] focus:ring-1 focus:ring-[#A294F9]"
                                />
                                <span className="min-w-0">{g.name}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-amber-400/90">No branches available.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className={actions}>
                <button type="button" onClick={() => setShowEditUserModal(false)} className="rounded-lg bg-[#555] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#444]">
                  Back
                </button>
                <button type="button" onClick={handleUpdateUser} className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]">
                  Update
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Change Password (self) Modal */}
        {showChangePasswordModal &&
          typeof document !== "undefined" &&
          createPortal(
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
          </div>,
          document.body
        )}

        {/* Change Password (for user) Modal */}
        {showChangePasswordModalForUser &&
          passwordUser &&
          typeof document !== "undefined" &&
          createPortal(
          <div className={backdrop} onClick={() => setShowChangePasswordModalForUser(false)}>
            <div className={content} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className={title}>Change Password - {passwordUser.name}</h2>
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
          </div>,
          document.body
        )}
      </div>

    </div>
  );
};

export default Settings;
