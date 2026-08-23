import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { rolesAPI, permissionsAPI, usersAPI } from '../utils/supabaseServices';

const UserCard = ({ user, onEdit, onDelete, onUpdate, roles }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || user?.email || '',
    email: user?.email || '',
    role: user?.role || 'client'
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copied, setCopied] = useState(false);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'sales': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'developer': return 'bg-green-100 text-green-700 border-green-200';
      case 'finance': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'hr': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'digital_marketer': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleSave = async () => {
    try {
      const payload = password.trim() ? { ...formData, password: password.trim() } : { ...formData };
      await onUpdate(user.id, payload);
      setIsEditing(false);
      setPassword('');
      setResetLink('');
      setCopied(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setPassword('');
    setResetLink('');
    setCopied(false);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white dark:bg-brand-black rounded-[1.5rem] border border-brand-grey/10 p-5 hover:bg-brand-yellow/5 hover:shadow-xl hover:shadow-brand-orange/5 hover:border-brand-orange/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm transition-colors ${isEditing ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-grey/5 text-brand-black dark:text-brand-white'}`}>
          {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                <Icon icon="mdi:check" className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="p-2 rounded-xl hover:bg-brand-grey/10 text-brand-grey hover:text-brand-black transition-colors">
                <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(user.id)} className="p-2 rounded-xl hover:bg-red-50 text-brand-grey hover:text-red-500 transition-colors">
                <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-2 animate-fade-in">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="soft-input w-full py-1.5 text-sm px-3"
              placeholder="Name"
            />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="soft-input w-full py-1.5 text-sm px-3"
              placeholder="Email"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="soft-input w-full py-1.5 text-sm px-3"
            >
              {roles.map(r => (
                <option key={r.name} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
              ))}
            </select>
            {/* Password management */}
            <div className="p-3 rounded-xl bg-brand-grey/5 border border-brand-grey/10 space-y-2">
              <div className="text-xs font-bold text-brand-grey">Password</div>
              <div className="text-[11px] text-brand-grey">
                For security reasons, the current password cannot be viewed. You can set a new password below or generate a reset link to send to the user.
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="soft-input w-full py-1.5 text-sm px-3"
                  placeholder="Set a new password (optional)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="p-2 rounded-lg bg-white dark:bg-brand-black border border-brand-grey/10 text-brand-grey hover:bg-brand-grey/5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon icon={showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
                <button
                  type="button"
                  disabled={resetting}
                  onClick={async () => {
                    try {
                      setResetting(true);
                      setCopied(false);
                      const res = await usersAPI.resetPassword(user.id);
                      const link = res?.data?.link || '';
                      setResetLink(link);
                    } catch (e) {
                      setResetLink('');
                    } finally {
                      setResetting(false);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-brand-black border border-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-grey/5 text-xs font-bold"
                >
                  {resetting ? 'Generating...' : 'Generate reset link'}
                </button>
                {resetLink && (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      readOnly
                      value={resetLink}
                      className="soft-input w-full text-xs"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className="p-2 rounded-lg bg-white dark:bg-brand-black border border-brand-grey/10 text-brand-grey hover:bg-brand-grey/5"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(resetLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        } catch {}
                      }}
                      title="Copy to clipboard"
                    >
                      <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="font-bold text-brand-black dark:text-brand-white truncate text-lg leading-tight">
                {user?.name || user?.email || '—'}
              </h3>
              <p className="text-xs text-brand-grey truncate mt-1">
                {user?.email || '—'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getRoleColor(user?.role || 'client')}`}>
                {(user?.role || 'client').replace('_', ' ')}
              </span>
              <span className="text-[10px] font-medium text-brand-grey/60 bg-brand-grey/5 px-2 py-1 rounded-md">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A'}
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const AddUserModal = ({ isOpen, onClose, onSubmit, roles, onCreateRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: roles[0]?.name || 'sales'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', email: '', password: '', role: 'sales' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-brand-black w-full max-w-md rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden"
      >
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between bg-brand-grey/5">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
            <div className="p-2 bg-brand-orange/10 rounded-xl text-brand-orange">
              <Icon icon="mdi:account-plus" className="w-5 h-5" />
            </div>
            Add New User
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 text-brand-grey transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5 ml-1">Role</label>
              <div className="flex gap-2">
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                >
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    const name = window.prompt('Enter new role name');
                    if (!name) return;
                    try {
                      await onCreateRole(name);
                      setFormData((d) => ({ ...d, role: name }));
                    } catch { }
                  }}
                  className="px-4 rounded-xl border border-brand-grey/20 hover:bg-brand-grey/5 text-brand-black dark:text-brand-white font-bold text-sm transition-colors"
                >
                  New
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-brand-grey hover:text-black hover:bg-brand-grey/10 transition-colors active:bg-brand-grey/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-bold bg-brand-orange text-black hover:bg-brand-yellow/60 shadow-lg shadow-brand-orange/20 transition-all active:scale-95 active:bg-brand-orange"
            >
              Create Account
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const RolePermissionsModal = ({ isOpen, onClose, roles }) => {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || null);
  const [allPerms, setAllPerms] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [p, r] = await Promise.all([
          permissionsAPI.getAll(),
          selectedRoleId ? rolesAPI.getPermissions(selectedRoleId) : Promise.resolve({ data: [] })
        ]);
        setAllPerms(p.data || []);
        setRolePerms(r.data || []);
      } catch { }
    };
    load();
  }, [isOpen, selectedRoleId]);

  if (!isOpen) return null;

  const toggle = (perm) => {
    const exists = rolePerms.find(rp => rp.module === perm.module && rp.action === perm.action);
    if (exists) setRolePerms(prev => prev.filter(rp => !(rp.module === perm.module && rp.action === perm.action)));
    else setRolePerms(prev => [...prev, { module: perm.module, action: perm.action }]);
  };

  const grouped = allPerms.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  const handleSave = async () => {
    if (!selectedRoleId) return;
    await rolesAPI.updatePermissions(selectedRoleId, rolePerms.map(p => ({ module: p.module, action: p.action })));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-brand-black w-full max-w-2xl rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-brand-grey/10 flex items-center justify-between bg-brand-grey/5">
          <h2 className="text-lg font-bold text-brand-black dark:text-brand-white flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <Icon icon="mdi:shield-account" className="w-5 h-5" />
            </div>
            Manage Permissions
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 text-brand-grey transition-colors">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="mb-6">
            <label className="block text-xs font-bold text-brand-grey uppercase tracking-wider mb-1.5 ml-1">Select Role to Edit</label>
            <select
              value={selectedRoleId || ''}
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
            >
              {roles.map(r => (
                <option key={r.id || r.name} value={r.id || ''}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {Object.keys(grouped).sort().map(mod => (
              <div key={mod} className="p-4 rounded-2xl bg-brand-grey/5 border border-brand-grey/10">
                <div className="font-bold text-brand-black dark:text-brand-white mb-3 capitalize flex items-center gap-2">
                  <Icon icon="mdi:cube-outline" className="w-4 h-4 text-brand-orange" />
                  {mod}
                </div>
                <div className="flex flex-wrap gap-3">
                  {grouped[mod].sort((a, b) => a.action.localeCompare(b.action)).map(perm => {
                    const checked = rolePerms.some(rp => rp.module === perm.module && rp.action === perm.action);
                    return (
                      <label key={perm.id} className={`inline-flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-2 rounded-xl transition-all ${checked ? 'bg-brand-orange/10 text-brand-orange font-bold' : 'bg-white dark:bg-brand-black text-brand-grey hover:bg-brand-grey/10'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm)}
                          className="hidden"
                        />
                        <Icon icon={checked ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"} className="w-4 h-4" />
                        <span className="capitalize">{perm.action}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-brand-grey/10 bg-brand-grey/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-brand-grey hover:bg-brand-grey/10 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-brand-orange text-black hover:bg-brand-yellow/60 shadow-lg shadow-brand-orange/20 transition-all active:scale-95">
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UserManagement = ({ users, onAdd, onUpdate, onDelete }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState([
    { name: 'admin' },
    { name: 'sales' },
    { name: 'developer' },
    { name: 'finance' },
    { name: 'hr' },
    { name: 'digital_marketer' },
  ]);
  const [showPerms, setShowPerms] = useState(false);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [inlineForm, setInlineForm] = useState({ name: '', email: '', password: '', role: roles[0]?.name || 'sales' });

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await rolesAPI.getAll();
        const list = (res.data || []).map(r => ({ name: r.name, id: r.id, description: r.description }));
        if (list.length) setRoles(list);
      } catch (e) { }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    setInlineForm(prev => ({ ...prev, role: prev.role || roles[0]?.name || 'sales' }));
  }, [roles]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, filterRole, searchQuery]);

  const stats = useMemo(() => {
    const total = users.length;
    const activeRoles = new Set(users.map(u => u.role)).size;
    const newThisMonth = users.filter(u => {
      if (!u.created_at) return false;
      const date = new Date(u.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { total, activeRoles, newThisMonth };
  }, [users]);

  const handleCreateRole = async (name) => {
    const roleData = { name };
    const res = await rolesAPI.create(roleData);
    const created = res.data || roleData;
    setRoles(prev => {
      if (prev.find(r => r.name.toLowerCase() === created.name.toLowerCase())) return prev;
      return [...prev, created];
    });
  };

  const handleAddUser = async (userData) => {
    try {
      await onAdd(userData);
      setShowAddModal(false);
      setShowInlineCreate(false);
      setInlineForm({ name: '', email: '', password: '', role: roles[0]?.name || 'sales' });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await onUpdate(userId, userData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await onDelete(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-brand-black p-5 rounded-[1.5rem] border border-brand-grey/10 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Icon icon="mdi:account-group" className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-black dark:text-brand-white">{stats.total}</div>
            <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">Total Users</div>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-black p-5 rounded-[1.5rem] border border-brand-grey/10 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Icon icon="mdi:shield-account" className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-black dark:text-brand-white">{stats.activeRoles}</div>
            <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">Active Roles</div>
          </div>
        </div>
        <div className="bg-white dark:bg-brand-black p-5 rounded-[1.5rem] border border-brand-grey/10 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
            <Icon icon="mdi:account-plus" className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-black dark:text-brand-white">{stats.newThisMonth}</div>
            <div className="text-xs font-bold text-brand-grey uppercase tracking-wider">New This Month</div>
          </div>
        </div>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-black dark:text-brand-white">User Management</h1>
          <p className="text-brand-grey mt-1">
            Manage system users, roles, and access permissions
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInlineCreate(prev => !prev)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-brand-grey/10 border border-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-yellow/20 hover:text-black font-bold text-sm flex items-center gap-2 transition-all active:bg-brand-yellow/30"
          >
            <Icon icon={showInlineCreate ? "mdi:chevron-up" : "mdi:lightning-bolt"} className="w-4 h-4 text-brand-orange" />
            <span>Quick Add</span>
          </button>
          <button
            onClick={() => setShowPerms(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-brand-grey/10 border border-brand-grey/10 text-brand-black dark:text-brand-white hover:bg-brand-yellow/20 hover:text-black font-bold text-sm flex items-center gap-2 transition-all active:bg-brand-yellow/30"
          >
            <Icon icon="mdi:shield-key" className="w-4 h-4 text-purple-500" />
            <span>Permissions</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 font-bold text-sm flex items-center gap-2 shadow-lg shadow-brand-black/5 transition-all active:scale-95 active:bg-brand-orange"
          >
            <Icon icon="mdi:plus" className="w-5 h-5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-brand-black p-2 rounded-2xl border border-brand-grey/10 shadow-sm">
        <div className="relative flex-1">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-sm font-medium text-brand-black dark:text-brand-white placeholder-brand-grey/50"
          />
        </div>
        <div className="w-px bg-brand-grey/10 hidden md:block"></div>
        <div className="flex items-center gap-2 px-3">
          <span className="text-xs font-bold text-brand-grey uppercase tracking-wider">Role:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-brand-black dark:text-brand-white focus:ring-0 cursor-pointer py-2 pl-2 pr-8"
          >
            <option value="all">All Roles</option>
            {roles.map(r => (
              <option key={r.name} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline Create User Section */}
      <AnimatePresence>
        {showInlineCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-[1.5rem] p-6 mb-6">
              <div className="flex items-center gap-2 mb-4 text-brand-orange font-bold">
                <Icon icon="mdi:lightning-bolt" className="w-5 h-5" />
                <h3>Quick Add User</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={inlineForm.name}
                  onChange={(e) => setInlineForm({ ...inlineForm, name: e.target.value })}
                  className="soft-input bg-white border-transparent"
                  placeholder="Full Name"
                />
                <input
                  type="email"
                  value={inlineForm.email}
                  onChange={(e) => setInlineForm({ ...inlineForm, email: e.target.value })}
                  className="soft-input bg-white border-transparent"
                  placeholder="Email Address"
                />
                <input
                  type="password"
                  value={inlineForm.password}
                  onChange={(e) => setInlineForm({ ...inlineForm, password: e.target.value })}
                  className="soft-input bg-white border-transparent"
                  placeholder="Password"
                />
                <div className="flex gap-2">
                  <select
                    value={inlineForm.role}
                    onChange={(e) => setInlineForm({ ...inlineForm, role: e.target.value })}
                    className="soft-input bg-white border-transparent flex-1"
                  >
                    {roles.map(r => (
                      <option key={r.name} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    className="px-4 rounded-xl bg-brand-orange text-black hover:bg-brand-yellow/60 font-bold shadow-md transition-all active:scale-95 active:bg-brand-orange"
                    onClick={async () => {
                      if (!inlineForm.name || !inlineForm.email || !inlineForm.password) return;
                      await handleAddUser(inlineForm);
                    }}
                  >
                    <Icon icon="mdi:plus" className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-brand-black rounded-[2rem] border border-brand-grey/10 border-dashed">
          <div className="w-20 h-20 mx-auto bg-brand-grey/5 rounded-full flex items-center justify-center text-brand-grey mb-4">
            <Icon icon="mdi:account-search-outline" className="w-10 h-10" />
          </div>
          <div className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">No users found</div>
          <p className="text-brand-grey text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={() => { }}
                onDelete={handleDeleteUser}
                onUpdate={handleUpdateUser}
                roles={roles}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        roles={roles}
        onCreateRole={handleCreateRole}
      />
      <RolePermissionsModal isOpen={showPerms} onClose={() => setShowPerms(false)} roles={roles.filter(r => r.id)} />
    </div>
  );
};

export default UserManagement;
