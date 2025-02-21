import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { FaPen, FaSearch } from "react-icons/fa";
import swal from "sweetalert";
import "./Settings.css";

const Settings = ({ openAddUserModal, setOpenAddUserModal }) => {
  // Search query state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal visibility states for editing and adding users
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // User list state (dummy data)
  const user = { role: "Admin", email: "admin@example.com", phone_number: "987654321", profile_img: "https://i.pravatar.cc/120?img=3" };
  const [users, setUsers] = useState([
    { id: 1, name: "Alice", email: "alice@example.com", phone: "987654321", role: "Admin" },
    { id: 2, name: "Bob", email: "bob@example.com", phone: "987654321", role: "User" },
    { id: 3, name: "Charlie", email: "charlie@example.com", phone: "987654321", role: "User" },
  ]);
  const relations = { name: "XYZ", email: "panel@example.com", phone_number: "987654321" };
  const activityHistory = [
    { id: 1, action: "Created assessment by XYZ", time: "22:11 01/02/2025" },
    { id: 2, action: "Created assessment by XYZ", time: "22:11 01/02/2025" },
    { id: 3, action: "Created assessment by XYZ", time: "22:11 01/02/" },
  ];

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

  // Function to handle change password action (for both admin and user)
  const handleChangePasswordForUser = (user) => {
    console.log("hello",user.name);
  };

  // Function to create a new user (Add User modal)
  const handleCreateUser = () => {
    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      name: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      role: newUserRole,
    };

    setUsers((prev) => [...prev, newUser]);
    setOpenAddUserModal(false); // Close modal using parent's setter
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
  const handleUpdateUser = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editUserId
          ? { ...u, name: editName, email: editEmail, phone: editPhone, role: editRole }
          : u
      )
    );
    setShowEditUserModal(false);
  };

  // Delete a user with confirmation
  const handleDeleteUser = (userId) => {
    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this user!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        swal("User has been deleted!", { icon: "success" });
      }
    });
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
                    <p>Name:</p>
                    <p>Email:</p>
                    <p>Phone Number:</p>
                  </div>
                </div>
                <div className="profile-d-display">
                  <p>{user.role}</p>
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
                  <button onClick={() => handleChangePasswordForUser()}>
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
                          onClick={() => handleChangePasswordForUser(user)}
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
              <div className="modal-buttons">
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
      </div>
    </div>
  );
};

export default Settings;
