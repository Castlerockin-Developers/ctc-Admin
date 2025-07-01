import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { FaPen, FaSearch } from "react-icons/fa";
import swal from "sweetalert";
import "./Settings.css";
import { authFetch } from "../scripts/AuthProvider"

const Settings = ({ openAddUserModal, setOpenAddUserModal }) => {
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");
  // User list state (dummy data)
  // const user = { role: "Admin", email: "admin@example.com", phone_number: "1234 5678", profile_img: "https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff&size=120" };
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [activityHistory, setActivityHistory] = useState([]);
  const [relations, setRelations] = useState({});



  // Modal visibility states for editing and adding users
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const fetchSettings = async () => {
      try {
        console.log("Fetching settings data...");
        const response = await authFetch("/admin/settings/", { method: "GET" });
        const data = await response.json();
        setSettingsData(data); // Update settings data state with the response
      } catch (error) {
        console.error("Error fetching settings data:", error);
      }
    };

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const setSettingsData = (data) => {
    const { activity_logs, admin_users, account_manager } = data;
    const user = { 
      name: data.user, 
      email: data.email, 
      phone_number: data.phone, 
      profile_img: data.profile_picture
    };

    const activityHistory =  activity_logs.map((log) => ({
      id: log.id,
      action: log.details,
      time: new Date(log.timestamp).toLocaleString(), 
    }));

    const relations = {
      name: account_manager.first_name, 
      email: account_manager.email, 
      phone_number: account_manager.phone_number };

    const users = admin_users.map((admin) => ({
      id: admin.id,
      name: `${admin.first_name} ${admin.last_name}`, 
      email: admin.email,
      phone: admin.contact || "N/A",
      role: admin.is_staff ? "Admin" : "Lecturer",
    }));

    setUser(user);
    setActivityHistory(activityHistory);
    setRelations(relations);
    setUsers(users);
    
  
  };


  // States for the Add User form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState("User");

  // States for the Edit User form
  const [editUserId, setEditUserId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");

  // States for the Change Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showChangePasswordModalForUser, setShowChangePasswordModalForUser] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPasswordUser, setNewPasswordUser] = useState("");
  const [confirmPasswordUser, setConfirmPasswordUser] = useState("");

  // Function to handle change password action (for both admin and user)
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
    }

    const newUserData = {
      request_type: "add_admin",
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
    };
  
    try {
      const response = await authFetch("/admin/settings/update/", {
        method: "POST",
        body: JSON.stringify(newUserData),
      });
      if (!response.ok) {
        swal("Error", "Failed to create user. Please try again.", "error");
        return;
      }
      fetchSettings();
      swal("Success", "User created successfully", "success");
    } catch (error) {
      console.error("Error creating user:", error);
      swal("Error", "Failed to create user. Please try again.", "error");
    }
    
    setOpenAddUserModal(false);
    
    // Clear form fields
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserRole("User");
  };

  // Open the Edit User modal and pre-populate fields
  const handleEditUser = (user) => {
    setEditUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditRole(user.role);
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
      console.error("Error updating user:", error);
      swal("Error", "Failed to update user. Please try again.", "error");
    }
    fetchSettings();
    setEditUserId(null);
    setEditName("");
    setEditEmail("");
    setEditPhone("");
    setEditRole("");
    setShowEditUserModal(false);
  };

  // Delete a user with confirmation
  const  handleDeleteUser = (userId) => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this user!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (willDelete) {
        const response = await authFetch(`/admin/settings/update/`+userId+"/", {
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

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      swal("Error", "Please fill in all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      swal("Error", "New password and confirm password do not match", "error");
      return;
    }

    const response = authFetch("/admin/settings/update/", {method: "POST", body: JSON.stringify({
      request_type: "change_password",
      old_password: oldPassword,
      new_password: newPassword,
    })});

    if (!response.ok) {
      if (response.status === 400) {
        swal("Error", "Old password is incorrect", "error");
        return;
      }
    }

    swal("Success", "Password changed successfully", "success");
    // Clear password fields and close modal
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePasswordModal(false);
  };


  // Filter users based on search query
  const filteredUserData = useMemo(() => {
    if (!searchQuery) return users;
    return users.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, users]);

  return (
    <div className="settings-container justify-center flex flex-wrap">
      <div className="settings-box">
        <h1>Settings</h1>
        {/* Profile Card */}
        <div className="profile-card">
          <h3>Profile:</h3>
          <div className="flex justify-between gap-2 profile-details-container">
            <div className="profile-details">
              <div className="flex">
                <div className="flex profile-img-col">
                  <img src={user.profile_img} alt="Profile Avatar" />
                  <div>
                    <p>Username:</p>
                    <p>Email:</p>
                    <p>Phone Number:</p>
                  </div>
                </div>
                <div className="profile-d-display">
                  <p>{user.name}</p>
                  <p>{user.email}</p>
                  <p>{user.phone_number}</p>
                </div>
              </div>
              <div className="Account-manager-box">
                <h5>Account Manager:</h5>
                <p>Name: {relations.name}</p>
                <div className="flex justify-between">
                  <p>Email: {relations.email}</p>
                  <p>Phone Number: {relations.phone_number}</p>
                </div>
              </div>
            </div>
            <div className="r-activity-history">
              <div className="activity-history">
                <h5>Activity History</h5>
                <div className="activity-list">
                  {activityHistory.length > 0 ? (
                    activityHistory.map((activity) => (
                      <p key={activity.id}>
                        {activity.action} - {activity.time}
                      </p>
                    ))
                  ) : (
                    <p>No activity found</p>
                  )}
                </div>
                <div className="flex justify-end">
                  {/* For admin change password, simply call the function */}
                  <button onClick={() => setShowChangePasswordModal(true)}>
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Users Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 manage-table-container">
          {/* Title */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-6 manage-btn">
            <motion.button whileTap={{ scale: 1.1 }} className="manage-active">
              Manage Users
            </motion.button>
          </div>
          {/* Search & Add User Button */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <div className="search-box flex items-center w-full sm:w-auto">
              <FaSearch className="m-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <motion.button
              whileTap={{ scale: 1.2 }}
              className="manage-create-btn w-full sm:w-auto"
              onClick={() => setOpenAddUserModal(true)}
            >
              Add User
            </motion.button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto manage-table">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-white">
                <th className="py-2 px-4">#ID</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Phone</th>
                <th className="py-2 px-4">Role</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUserData.length > 0 ? (
                filteredUserData.map((user) => (
                  <tr key={user.id}>
                    <td className="py-2 px-4 w-50">{user.id}</td>
                    <td className="py-2 px-4 w-50">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4 w-50">{user.phone}</td>
                    <td className="py-2 px-4 w-50">{user.role}</td>
                    <td className="py-2 px-4 align-middle text-center w-fit-content">
                      <div className="flex justify-end items-center gap-4">
                        <motion.button
                          whileTap={{ scale: 1.2 }}
                          className="text-white flex gap-2 px-3 py-1 rounded m-edit-btn"
                          onClick={() => handleEditUser(user)}
                        >
                          <FaPen className="icon-pen" />
                          Edit
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 1.2 }}
                          className="bg-red-600 text-white px-3 py-1 rounded m-delte-btn"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 1.2 }}
                          className="bg-red-600 text-white px-3 py-1 rounded m-password-btn"
                          onClick={() => {
                            setPasswordUser(user);
                            setShowChangePasswordModalForUser(true)} }
                        >
                          Change Password
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {openAddUserModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Add User</h2>
              <div className="modal-row">
                <label>Name:</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                />
              </div>
              <div className="modal-row">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="modal-row">
                <label>Phone:</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="modal-row">
                <label>Role:</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div className="setting-modal-buttons">
                <button onClick={() => setOpenAddUserModal(false)}>Back</button>
                <button onClick={handleCreateUser} className="create-btn">
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Edit User</h2>
              <div className="modal-row">
                <label>Name:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="modal-row">
                <label>Email:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="modal-row">
                <label>Phone:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="modal-row">
                <label>Role:</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button onClick={() => setShowEditUserModal(false)}>Back</button>
                <button onClick={handleUpdateUser} className="create-btn">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
        {showChangePasswordModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Change Password</h2>
              <div className="modal-row">
                <label>Old Password:</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter old password"
                />
              </div>
              <div className="modal-row">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="modal-row">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="setting-modal-buttons">
                <button onClick={() => setShowChangePasswordModal(false)}>
                  Back
                </button>
                <button onClick={handleChangePassword} className="create-btn">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
        {showChangePasswordModalForUser && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Change Password for {passwordUser.name}</h2>
              <div className="modal-row">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPasswordUser}
                  onChange={(e) => setNewPasswordUser(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="modal-row">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPasswordUser}
                  onChange={(e) => setConfirmPasswordUser(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="setting-modal-buttons">
                <button onClick={() => setShowChangePasswordModalForUser(false)}>
                  Back
                </button>
                <button onClick={handleChangePasswordForUser} className="create-btn">
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