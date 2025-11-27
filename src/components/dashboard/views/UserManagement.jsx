import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, RefreshCw, Search, CheckCircle, XCircle, UserPlus, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { activityLogger } from '../../../services/activityLogger';

const UserManagement = ({ user: currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'lab_technician',
        fullName: '',
        department: '',
        hospital: '',
        specialization: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data: accounts, error } = await supabase
                .from('auth_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const { data: labTechs } = await supabase.from('lab_technician_profile').select('*');
            const { data: medicalOfficers } = await supabase.from('medical_officer_profile').select('*');
            const { data: pathologists } = await supabase.from('pathologist_profile').select('*');
            const { data: healthOfficers } = await supabase.from('health_officer_profile').select('*');
            const { data: admins } = await supabase.from('admin_profile').select('*');

            const mappedUsers = accounts.map(account => {
                let fullName = account.email;
                if (account.role === 'lab_technician') fullName = labTechs?.find(p => p.account_id === account.id)?.full_name || account.email;
                else if (account.role === 'medical_officer') fullName = medicalOfficers?.find(p => p.account_id === account.id)?.full_name || account.email;
                else if (account.role === 'pathologist') fullName = pathologists?.find(p => p.account_id === account.id)?.full_name || account.email;
                else if (account.role === 'health_officer') fullName = healthOfficers?.find(p => p.account_id === account.id)?.full_name || account.email;
                else if (account.role === 'admin') fullName = admins?.find(p => p.account_id === account.id)?.full_name || account.email;
                return { ...account, fullName };
            });

            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
        try {
            await supabase.from('auth_accounts').update({ status: newStatus }).eq('id', userId);
            await fetchUsers();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Delete this user?')) return;
        try {
            const userToDelete = users.find(u => u.id === userId);
            await supabase.from('auth_accounts').delete().eq('id', userId);
            
            // Log activity
            if (currentUser && userToDelete) {
                await activityLogger.logUserManagement(currentUser, 'Deleted', userToDelete.email);
            }
            
            await fetchUsers();
            alert('✅ User deleted successfully!');
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate inputs
            if (!newUser.email || !newUser.password || !newUser.fullName) {
                alert('Please fill in all required fields');
                setSubmitting(false);
                return;
            }

            if (newUser.password.length < 6) {
                alert('Password must be at least 6 characters');
                setSubmitting(false);
                return;
            }

            // Check if email already exists
            const { data: existingUsers } = await supabase
                .from('auth_accounts')
                .select('id')
                .eq('email', newUser.email);

            if (existingUsers && existingUsers.length > 0) {
                alert('Email already exists!');
                setSubmitting(false);
                return;
            }

            // Insert into auth_accounts (using password_hash column)
            const { data: account, error: accountError } = await supabase
                .from('auth_accounts')
                .insert([{
                    email: newUser.email,
                    password_hash: newUser.password, // Using password_hash column (in production, hash this!)
                    role: newUser.role,
                    status: 'approved'
                }])
                .select()
                .single();

            if (accountError) throw accountError;

            // Insert into role-specific profile table
            const profileData = {
                account_id: account.id,
                full_name: newUser.fullName,
                department: newUser.department || 'General',
                hospital: newUser.hospital || 'General Hospital'
            };

            let profileTable = '';
            if (newUser.role === 'lab_technician') {
                profileTable = 'lab_technician_profile';
            } else if (newUser.role === 'medical_officer') {
                profileTable = 'medical_officer_profile';
            } else if (newUser.role === 'pathologist') {
                profileTable = 'pathologist_profile';
                profileData.specialization = newUser.specialization || 'General Pathology';
            } else if (newUser.role === 'health_officer') {
                profileTable = 'health_officer_profile';
            } else if (newUser.role === 'admin') {
                profileTable = 'admin_profile';
            }

            if (profileTable) {
                const { error: profileError } = await supabase
                    .from(profileTable)
                    .insert([profileData]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // Don't throw - account is created, profile can be added later
                }
            }

            // Log activity
            if (currentUser) {
                await activityLogger.logUserManagement(
                    currentUser, 
                    'Created', 
                    `${newUser.fullName} (${newUser.email}) as ${newUser.role}`
                );
            }

            alert(`✅ User ${newUser.fullName} created successfully!\n\nLogin Credentials:\nEmail: ${newUser.email}\nPassword: ${newUser.password}\n\nPlease save these credentials!`);
            
            // Reset form
            setNewUser({
                email: '',
                password: '',
                role: 'lab_technician',
                fullName: '',
                department: '',
                hospital: '',
                specialization: ''
            });
            setShowAddModal(false);
            await fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleColor = (role) => {
        const colors = { admin: '#f97316', lab_technician: '#00f0ff', medical_officer: '#00ff88', pathologist: '#a855f7', health_officer: '#3b82f6' };
        return colors[role] || '#ffffff';
    };

    const getRoleLabel = (role) => {
        const labels = { admin: 'Admin', lab_technician: 'Lab Technician', medical_officer: 'Medical Officer', pathologist: 'Pathologist', health_officer: 'Health Officer' };
        return labels[role] || role;
    };

    const filteredUsers = users.filter(user => {
        const matchesFilter = filter === 'all' || user.role === filter;
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>User <span className="text-gradient">Management</span></h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage system users ({filteredUsers.length}/{users.length})</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setShowAddModal(true)} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #00f0ff, #0080ff)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                        <UserPlus size={18} />
                        Add User
                    </button>
                    <button onClick={fetchUsers} disabled={loading} style={{ padding: '0.75rem 1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '8px', color: 'var(--color-primary)', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', outline: 'none' }} />
                    </div>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', borderRadius: '8px', color: 'white', cursor: 'pointer', outline: 'none' }}>
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="lab_technician">Lab Technician</option>
                        <option value="medical_officer">Medical Officer</option>
                        <option value="pathologist">Pathologist</option>
                        <option value="health_officer">Health Officer</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>
            ) : (
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                <th style={{ padding: '1.5rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>User</th>
                                <th style={{ padding: '1.5rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>Role</th>
                                <th style={{ padding: '1.5rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>Email</th>
                                <th style={{ padding: '1.5rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>Status</th>
                                <th style={{ padding: '1.5rem', textAlign: 'left', color: 'var(--color-text-muted)' }}>Joined</th>
                                <th style={{ padding: '1.5rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${getRoleColor(user.role)}20`, border: `2px solid ${getRoleColor(user.role)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: getRoleColor(user.role) }}>
                                                {user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600' }}>{user.fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', background: `${getRoleColor(user.role)}20`, border: `1px solid ${getRoleColor(user.role)}`, borderRadius: '6px', fontSize: '0.875rem', color: getRoleColor(user.role) }}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>{user.email}</td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <button onClick={() => handleStatusToggle(user.id, user.status)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: user.status === 'approved' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 188, 46, 0.1)', border: `1px solid ${user.status === 'approved' ? '#00ff88' : '#febc2e'}`, borderRadius: '6px', fontSize: '0.875rem', color: user.status === 'approved' ? '#00ff88' : '#febc2e', cursor: 'pointer' }}>
                                            {user.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {user.status === 'approved' ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td style={{ padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                        <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '0.5rem', background: 'rgba(255, 0, 85, 0.1)', border: '1px solid #ff0055', borderRadius: '6px', color: '#ff0055', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add User Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                padding: '2rem',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Add New User</h2>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} color="white" />
                                </button>
                            </div>

                            <form onSubmit={handleAddUser}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Full Name */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newUser.fullName}
                                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                            placeholder="Dr. John Smith"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="user@example.com"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Password * (min 6 characters)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            minLength={6}
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="Enter password"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                            User will login with this password
                                        </p>
                                    </div>

                                    {/* Role */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Role *
                                        </label>
                                        <select
                                            required
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="lab_technician">Lab Technician</option>
                                            <option value="medical_officer">Medical Officer</option>
                                            <option value="pathologist">Pathologist</option>
                                            <option value="health_officer">Health Officer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.department}
                                            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                            placeholder="Laboratory / Pathology / etc."
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Hospital */}
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            Hospital/Facility
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.hospital}
                                            onChange={(e) => setNewUser({ ...newUser, hospital: e.target.value })}
                                            placeholder="General Hospital KL"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    {/* Specialization (for Pathologist only) */}
                                    {newUser.role === 'pathologist' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                                Specialization
                                            </label>
                                            <input
                                                type="text"
                                                value={newUser.specialization}
                                                onChange={(e) => setNewUser({ ...newUser, specialization: e.target.value })}
                                                placeholder="General Pathology / Microbiology / etc."
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid var(--color-glass-border)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            disabled={submitting}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid var(--color-glass-border)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: submitting ? 'not-allowed' : 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem',
                                                background: submitting ? 'rgba(0, 240, 255, 0.3)' : 'linear-gradient(135deg, #00f0ff, #0080ff)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: 'white',
                                                cursor: submitting ? 'not-allowed' : 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {submitting ? 'Creating...' : 'Create User'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
