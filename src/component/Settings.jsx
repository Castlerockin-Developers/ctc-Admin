import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FaPen, FaSearch } from "react-icons/fa";
import swal from 'sweetalert';
import './Settings.css';

const Settings = () => {
    // Search query state
    const [searchQuery, setSearchQuery] = useState("");

    // Modal visibility states
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    // User list state (dummy data)
    const [users, setUsers] = useState([
        { id: 1, name: "Alice", email: "alice@example.com", phone: "987654321", role: "Admin" },
        { id: 2, name: "Bob", email: "bob@example.com", phone: "987654321", role: "User" },
        { id: 3, name: "Charlie", email: "charlie@example.com", phone: "987654321", role: "User" },
    ]);

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

    // Create a new user (Add User modal)
    const handleCreateUser = () => {
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name: newUserName,
            email: newUserEmail,
            phone: newUserPhone,
            role: newUserRole,
        };

        setUsers(prev => [...prev, newUser]);
        setShowAddUserModal(false);
        // Clear form fields
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPhone("");
        setNewUserRole("User");
    };

    // Open the Add User modal
    const onCreateNew = () => {
        setShowAddUserModal(true);
    };

    // Open the Edit User modal and pre-populate fields with the user data
    const handleEditUser = (user) => {
        setEditUserId(user.id);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPhone(user.phone);
        setEditRole(user.role);
        setShowEditUserModal(true);
    };

    // Update the user with the new values from the Edit modal
    const handleUpdateUser = () => {
        setUsers(prev =>
            prev.map(u =>
                u.id === editUserId
                    ? { ...u, name: editName, email: editEmail, phone: editPhone, role: editRole }
                    : u
            )
        );
        setShowEditUserModal(false);
    };

    // Delete a user after confirming with SweetAlert
    const handleDeleteUser = (userId) => {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this user!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                swal("User has been deleted!", { icon: "success" });
            }
        });
    };

    // Handle password change and validate new passwords
    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            swal("Error", "New password and confirm password do not match", "error");
            return;
        }
        // Password change logic here (e.g., API call). For now, show success.
        swal("Success", "Password changed successfully", "success");
        // Clear password fields and close modal
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePasswordModal(false);
    };

    // Filter users based on the search query
    const filteredUserData = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter((user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, users]);

    return (
        <div className='settings-container justify-center flex flex-wrap'>
            <div className='settings-box'>
                <h1>Settings</h1>
                <div className='profile-card'>
                    <h3>Profile:</h3>
                    <div className='flex justify-between gap-2 profile-details-container'>
                        <div className='profile-details'>
                            <div className='flex'>
                                <div className='flex'>
                                    <div className='flex profile-img-col'>
                                        <img src="https://i.pravatar.cc/120?img=3" alt="Profile Avatar" />
                                        <div>
                                            <p>Name:</p>
                                            <p>Email:</p>
                                            <p>Phone Number:</p>
                                        </div>
                                    </div>
                                </div>
                                <div className='profile-d-display'>
                                    <p>Administration</p>
                                    <p>admin@castlerockin.com</p>
                                    <p>987654321</p>
                                </div>
                            </div>
                            <div className='Account-manager-box'>
                                <h5>Account Manager:</h5>
                                <p>Name: Relation Manager</p>
                                <div className='flex justify-between'>
                                    <p>Email: abc@xyz.in</p>
                                    <p>Phone Number: 987654321</p>
                                </div>
                            </div>
                        </div>
                        <div className='r-activity-history'>
                            <div className='activity-history'>
                                <h5>Activity History</h5>
                                <div className='activity-list'>
                                    <p>Created assessment by XYZ - 22:11 01/02/2025</p>
                                    <p>Created assessment by XYZ - 22:11 01/02/2025</p>
                                    <p>Created assessment by XYZ - 22:11 01/02/2025</p>
                                </div>
                                <div className='flex justify-end'>
                                    <button onClick={() => setShowChangePasswordModal(true)}>Change Password</button>
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

                    {/* Search Bar & Create Button */}
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
                            onClick={onCreateNew}
                        >
                            Add User
                        </motion.button>
                    </div>
                </div>

                {/* Table Section: Users */}
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
                                        <td className="py-2 px-4">{user.id}</td>
                                        <td className="py-2 px-4">{user.name}</td>
                                        <td className="py-2 px-4">{user.email}</td>
                                        <td className="py-2 px-4">{user.phone}</td>
                                        <td className="py-2 px-4">{user.role}</td>
                                        <td className="py-2 px-4 align-middle text-center">
                                            <div className="flex justify-center items-center gap-4">
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

                {/* ========== MODAL FOR ADDING A NEW USER ========== */}
                {showAddUserModal && (
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
                                <select
                                    value={newUserRole}
                                    onChange={(e) => setNewUserRole(e.target.value)}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="User">User</option>
                                </select>
                            </div>
                            <div className="modal-buttons">
                                <button onClick={() => setShowAddUserModal(false)}>Back</button>
                                <button onClick={handleCreateUser} className="create-btn">
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== MODAL FOR EDITING AN EXISTING USER ========== */}
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
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
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

                {/* ========== MODAL FOR CHANGING PASSWORD ========== */}
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
                            <div className="modal-buttons">
                                <button onClick={() => setShowChangePasswordModal(false)}>Back</button>
                                <button onClick={handleChangePassword} className="create-btn">
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
