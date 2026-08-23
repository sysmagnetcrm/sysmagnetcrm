import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { rolesAPI, permissionsAPI } from '../utils/supabaseServices';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

const EronSelect = ({ value, onChange, options, placeholder, name, defaultValue }) => (
  <div className="relative">
    <select
      name={name}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      className="appearance-none w-full bg-white dark:bg-brand-black border border-brand-grey/20 rounded-xl px-4 py-2 text-sm font-medium text-brand-black dark:text-brand-white focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all pr-10"
    >
      {placeholder && <option value="all">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    <Icon icon="mdi:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey w-5 h-5 pointer-events-none" />
  </div>
);

const DEFAULT_ROLES = [
  { id: 'role-admin', name: 'admin', label: 'Administrator', description: 'Full system access and administrative management' },
  { id: 'role-sales', name: 'sales', label: 'Sales', description: 'Lead management, sales pipeline, and client communication' },
  { id: 'role-finance', name: 'finance', label: 'Finance', description: 'Invoices, payments, financial reports, and payroll overview' },
  { id: 'role-hr', name: 'hr', label: 'HR', description: 'Employee management, attendance tracking, payroll, and recruitment' },
  { id: 'role-employee', name: 'employee', label: 'Employee', description: 'General staff operational access for daily tasks and attendance' },
  { id: 'role-client', name: 'client', label: 'Client', description: 'Client portal access for support tickets and project tracking' }
];

const DEFAULT_PERMISSIONS = [
  { id: 'p1', name: 'dashboard.read', category: 'Dashboard', description: 'View dashboard metrics and summaries' },
  { id: 'p2', name: 'reports.read', category: 'Reports', description: 'Access analytics and operational reports' },
  { id: 'p3', name: 'leads.read', category: 'Leads', description: 'View leads and pipeline' },
  { id: 'p4', name: 'leads.create', category: 'Leads', description: 'Create new sales leads' },
  { id: 'p5', name: 'leads.update', category: 'Leads', description: 'Update lead status and details' },
  { id: 'p6', name: 'leads.delete', category: 'Leads', description: 'Delete sales leads' },
  { id: 'p7', name: 'clients.read', category: 'Clients', description: 'View client list and details' },
  { id: 'p8', name: 'clients.create', category: 'Clients', description: 'Create new client accounts' },
  { id: 'p9', name: 'clients.update', category: 'Clients', description: 'Update client information' },
  { id: 'p10', name: 'clients.delete', category: 'Clients', description: 'Delete client accounts' },
  { id: 'p11', name: 'tasks.read', category: 'Tasks', description: 'View assigned and project tasks' },
  { id: 'p12', name: 'tasks.create', category: 'Tasks', description: 'Create new tasks' },
  { id: 'p13', name: 'tasks.update', category: 'Tasks', description: 'Update task status and comments' },
  { id: 'p14', name: 'tasks.delete', category: 'Tasks', description: 'Delete tasks' },
  { id: 'p15', name: 'payments.read', category: 'Payments', description: 'View invoices and payment history' },
  { id: 'p16', name: 'payments.create', category: 'Payments', description: 'Generate invoices and log payments' },
  { id: 'p17', name: 'payments.update', category: 'Payments', description: 'Modify invoice and payment details' },
  { id: 'p18', name: 'payments.delete', category: 'Payments', description: 'Void or delete payment records' },
  { id: 'p19', name: 'users.read', category: 'Users & HR', description: 'View user accounts and employee records' },
  { id: 'p20', name: 'users.create', category: 'Users & HR', description: 'Create user accounts and employees' },
  { id: 'p21', name: 'users.update', category: 'Users & HR', description: 'Update user roles and employee details' },
  { id: 'p22', name: 'users.delete', category: 'Users & HR', description: 'Delete or deactivate user accounts' },
  { id: 'p23', name: 'payroll.read', category: 'Payroll', description: 'View payroll cycles and pay stubs' },
  { id: 'p24', name: 'payroll.create', category: 'Payroll', description: 'Generate payroll runs' },
  { id: 'p25', name: 'payroll.update', category: 'Payroll', description: 'Modify payroll records' },
  { id: 'p26', name: 'settings.read', category: 'Settings', description: 'View system settings' },
  { id: 'p27', name: 'settings.update', category: 'Settings', description: 'Modify system settings' },
  { id: 'p28', name: 'audit_logs.read', category: 'Audit Logs', description: 'View administrative audit logs' }
];

const UserManagement = ({ users: rawUsers = [], onAdd, onUpdate, onDelete }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin';

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loadingRBAC, setLoadingRBAC] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showAddUser, setShowAddUser] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Permission Drawer state
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState(new Set());
  const [savingPerms, setSavingPerms] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  // Load Roles and Permissions
  useEffect(() => {
    const loadRBAC = async () => {
      setLoadingRBAC(true);
      try {
        const [rolesRes, permsRes] = await Promise.all([
          rolesAPI.getAll(),
          permissionsAPI.getAll()
        ]);
        const fetchedRoles = rolesRes.data && rolesRes.data.length > 0 ? rolesRes.data : DEFAULT_ROLES;
        const fetchedPerms = permsRes.data && permsRes.data.length > 0 ? permsRes.data : DEFAULT_PERMISSIONS;

        setRoles(fetchedRoles);
        setPermissions(fetchedPerms);
        if (fetchedRoles.length > 0) {
          setSelectedRoleForPerms(fetchedRoles[0].id || fetchedRoles[0].name);
        }
      } catch (e) {
        console.error('Failed to load RBAC mapping, using canonical defaults:', e);
        setRoles(DEFAULT_ROLES);
        setPermissions(DEFAULT_PERMISSIONS);
        setSelectedRoleForPerms(DEFAULT_ROLES[0].id);
      } finally {
        setLoadingRBAC(false);
      }
    };
    loadRBAC();
  }, []);

  // Fetch role permissions when drawer role changes
  useEffect(() => {
    if (!selectedRoleForPerms || !showPermissions) return;
    const fetchRolePerms = async () => {
      try {
        const res = await permissionsAPI.getRolePermissions(selectedRoleForPerms);
        if (res.data) {
          const ids = new Set(res.data.map(rp => rp.permission_id));
          setSelectedPermIds(ids);
        } else {
          // If no role_permissions exist, enable all for admin
          const activeRoleObj = roles.find(r => r.id === selectedRoleForPerms || r.name === selectedRoleForPerms);
          if (activeRoleObj && activeRoleObj.name === 'admin') {
            setSelectedPermIds(new Set(permissions.map(p => p.id)));
          } else {
            setSelectedPermIds(new Set());
          }
        }
      } catch (e) {
        console.warn('Could not fetch role_permissions:', e);
      }
    };
    fetchRolePerms();
  }, [selectedRoleForPerms, showPermissions, roles, permissions]);

  const filteredUsers = useMemo(() => {
    return rawUsers.filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      
      let uStatus = u.is_active === false ? 'inactive' : 'active';
      if (u.status && typeof u.status === 'string') uStatus = u.status.toLowerCase();
      
      const matchesStatus = filterStatus === 'all' || uStatus === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [rawUsers, searchQuery, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const total = rawUsers.length;
    const active = rawUsers.filter(u => u.is_active !== false && (u.status || '').toLowerCase() !== 'inactive').length;
    const activeRoles = new Set(rawUsers.map(u => u.role)).size || roles.length;
    const newThisMonth = rawUsers.filter(u => {
      if (!u.created_at) return false;
      const d = new Date(u.created_at);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length;
    return { total, active, activeRoles, newThisMonth };
  }, [rawUsers, roles]);

  const handleCreateUser = async (data) => {
    try {
      const res = await onAdd(data);
      if (res?.error) throw res.error;
      showToast('User created successfully');
      setShowAddUser(false);
    } catch (e) {
      showToast(e.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      const res = await onUpdate(id, data);
      if (res?.error) throw res.error;
      showToast('User updated successfully');
      setEditingUser(null);
    } catch (e) {
      showToast(e.message || 'Failed to update user', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      const res = await onDelete(deletingUser.id);
      if (res?.error) throw res.error;
      showToast('User removed successfully');
      setDeletingUser(null);
    } catch (e) {
      showToast(e.message || 'Failed to delete user', 'error');
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPerms) return;
    setSavingPerms(true);
    try {
      await permissionsAPI.setRolePermissions(selectedRoleForPerms, Array.from(selectedPermIds));
      showToast('Role permissions updated successfully');
    } catch (e) {
      showToast(e.message || 'Failed to save permissions', 'error');
    } finally {
      setSavingPerms(false);
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermIds(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const getRoleDisplayName = (roleCode) => {
    if (!roleCode) return 'Unknown';
    const match = roles.find(r => r.name.toLowerCase() === roleCode.toLowerCase());
    if (match) return match.label || match.name.charAt(0).toUpperCase() + match.name.slice(1);
    return roleCode.charAt(0).toUpperCase() + roleCode.slice(1);
  };

  const roleOptions = useMemo(() => {
    return roles.map(r => ({
      value: r.name,
      label: r.label || (r.name.charAt(0).toUpperCase() + r.name.slice(1))
    }));
  }, [roles]);

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const groups = {};
    permissions.forEach(p => {
      const cat = p.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [permissions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[28px] font-bold text-[#101828] dark:text-white">User Management</h1>
          <p className="text-[#667085] text-[15px] mt-1">Manage system users, roles, and access permissions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPermissions(true)}
            disabled={!isAdmin}
            className={`px-4 py-2.5 rounded-xl border border-[#E4E7EC] text-[14px] font-semibold flex items-center gap-2 transition-colors ${isAdmin ? 'bg-white hover:bg-gray-50 text-[#101828]' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
          >
            <Icon icon="mdi:shield-key-outline" className="w-[18px] h-[18px]" />
            Permissions
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            disabled={!isAdmin}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-semibold flex items-center gap-2 transition-colors ${isAdmin ? 'bg-brand-orange text-white hover:bg-[#E66E00]' : 'bg-brand-orange/50 text-white/50 cursor-not-allowed'}`}
          >
            <Icon icon="mdi:account-plus-outline" className="w-[18px] h-[18px]" />
            Add User
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', val: stats.total, icon: 'mdi:account-group' },
          { label: 'Active Users', val: stats.active, icon: 'mdi:account-check' },
          { label: 'Configured Roles', val: stats.activeRoles, icon: 'mdi:shield-account' },
          { label: 'New This Month', val: stats.newThisMonth, icon: 'mdi:account-clock' }
        ].map(kpi => (
          <div key={kpi.label} className="bg-white dark:bg-brand-black border border-[#E4E7EC] rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F8F9FB] dark:bg-gray-800 rounded-xl flex items-center justify-center text-[#667085]">
              <Icon icon={kpi.icon} className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[24px] font-bold text-[#101828] dark:text-white leading-tight">{kpi.val}</div>
              <div className="text-[13px] font-medium text-[#667085] mt-0.5">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-brand-black border border-[#E4E7EC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#E4E7EC] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#F8F9FB]/50">
          <div className="relative w-full md:w-80">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085] w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-brand-black border border-[#E4E7EC] rounded-xl text-[14px] text-[#101828] dark:text-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="w-full md:w-40">
              <EronSelect
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                placeholder="All Roles"
                options={roleOptions}
              />
            </div>
            <div className="w-full md:w-40">
              <EronSelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                placeholder="All Statuses"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] text-[12px] font-semibold text-[#667085] uppercase tracking-wider border-b border-[#E4E7EC]">
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Active</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loadingRBAC ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-[#667085]">
                    <Icon icon="heroicons:arrow-path" className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-orange" />
                    Loading User Management data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-[#F8F9FB] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon icon="mdi:account-search" className="w-8 h-8 text-[#667085]" />
                    </div>
                    <div className="text-[16px] font-bold text-[#101828] dark:text-white">No users found</div>
                    <p className="text-[14px] text-[#667085] mt-1">
                      {rawUsers.length === 0 ? 'Create your first user to start managing access.' : 'There are no users matching your current filters.'}
                    </p>
                    {rawUsers.length > 0 && (
                      <button onClick={() => {setSearchQuery(''); setFilterRole('all'); setFilterStatus('all');}} className="mt-4 text-brand-orange font-semibold text-[14px] hover:underline">
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#F8F9FB]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-[16px] shrink-0 border border-brand-orange/20">
                          {String(u.name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[#101828] dark:text-white truncate">{u.name || '—'}</div>
                          <div className="text-[13px] text-[#667085] truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[14px] text-[#101828] dark:text-white font-medium">{getRoleDisplayName(u.role)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const s = (u.is_active === false || (u.status || '').toLowerCase() === 'inactive') ? 'inactive' : 'active';
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border ${s === 'active' ? 'bg-[#12B76A]/10 text-[#12B76A] border-[#12B76A]/20' : 'bg-[#667085]/10 text-[#667085] border-[#667085]/20'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s === 'active' ? 'bg-[#12B76A]' : 'bg-[#667085]'}`}></span>
                            {s === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#667085]">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#667085]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingUser(u)} className="p-2 text-[#667085] hover:bg-white border border-transparent hover:border-[#E4E7EC] shadow-sm rounded-lg transition-all" title="Edit User">
                          <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeletingUser(u)} disabled={u.id === currentUser?.id} className={`p-2 rounded-lg transition-all border border-transparent ${u.id === currentUser?.id ? 'text-gray-300' : 'text-[#667085] hover:bg-[#FEF3F2] hover:text-[#D92D20] hover:border-[#FEE4E2] shadow-sm'}`} title="Delete User">
                          <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-[#E4E7EC] flex justify-between items-center">
                <h2 className="text-[18px] font-bold text-[#101828]">Add New User</h2>
                <button onClick={() => setShowAddUser(false)} className="text-[#667085] hover:bg-[#F8F9FB] p-2 rounded-lg">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleCreateUser({
                  name: fd.get('name'),
                  email: fd.get('email'),
                  role: fd.get('role'),
                  password: fd.get('password')
                });
              }}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Full Name *</label>
                    <input name="name" required className="w-full bg-white border border-[#E4E7EC] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Email Address *</label>
                    <input name="email" type="email" required className="w-full bg-white border border-[#E4E7EC] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" placeholder="john@example.com" />
                    <p className="text-[12px] text-[#667085] mt-1">We'll use this address for authentication.</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Temporary Password *</label>
                    <input name="password" type="password" required className="w-full bg-white border border-[#E4E7EC] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Role *</label>
                    <EronSelect name="role" options={roleOptions} />
                  </div>
                </div>
                <div className="p-6 border-t border-[#E4E7EC] bg-[#F8F9FB] flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 bg-white border border-[#E4E7EC] text-[#344054] font-semibold text-[14px] rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-brand-orange text-white font-semibold text-[14px] rounded-xl hover:bg-[#E66E00] transition-colors">
                    Create User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Drawer */}
      <AnimatePresence>
        {editingUser && (
          <>
            <div className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-40" onClick={() => setEditingUser(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-[#E4E7EC]"
            >
              <div className="p-6 border-b border-[#E4E7EC] flex justify-between items-center bg-[#F8F9FB]">
                <h2 className="text-[18px] font-bold text-[#101828]">Edit User</h2>
                <button onClick={() => setEditingUser(null)} className="text-[#667085] hover:bg-[#E4E7EC] p-2 rounded-lg transition-colors">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <form id="edit-user-form" onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  handleUpdateUser(editingUser.id, {
                    name: fd.get('name'),
                    role: fd.get('role'),
                    status: fd.get('status'),
                    is_active: fd.get('status') === 'active'
                  });
                }} className="space-y-5">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-[24px] border border-brand-orange/20">
                      {String(editingUser.name || editingUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-[#101828]">{editingUser.email}</div>
                      <div className="text-[13px] text-[#667085]">Email cannot be changed here.</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Full Name</label>
                    <input name="name" defaultValue={editingUser.name} required className="w-full bg-white border border-[#E4E7EC] rounded-xl px-3 py-2 text-[14px] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Role</label>
                    <EronSelect name="role" defaultValue={editingUser.role} options={roleOptions} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Status</label>
                    <EronSelect name="status" defaultValue={editingUser.is_active !== false && (editingUser.status || '').toLowerCase() !== 'inactive' ? 'active' : 'inactive'} options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]} />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-[#E4E7EC] bg-[#F8F9FB] flex gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 bg-white border border-[#E4E7EC] text-[#344054] font-semibold text-[14px] rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" form="edit-user-form" className="flex-1 py-2.5 bg-brand-orange text-white font-semibold text-[14px] rounded-xl hover:bg-[#E66E00] transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FEF3F2] text-[#D92D20] flex items-center justify-center mx-auto mb-4 border border-[#FEE4E2]">
                  <Icon icon="mdi:alert-outline" className="w-6 h-6" />
                </div>
                <h3 className="text-[18px] font-bold text-[#101828] mb-2">Delete User?</h3>
                <p className="text-[14px] text-[#667085]">
                  You're about to remove <strong className="text-[#344054]">{deletingUser.name || deletingUser.email}</strong>. This action cannot be easily undone.
                </p>
              </div>
              <div className="p-4 border-t border-[#E4E7EC] bg-[#F8F9FB] flex gap-3">
                <button onClick={() => setDeletingUser(null)} className="flex-1 py-2 bg-white border border-[#E4E7EC] text-[#344054] font-semibold text-[14px] rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-[#D92D20] text-white font-semibold text-[14px] rounded-xl hover:bg-[#B42318] transition-colors shadow-sm">
                  Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Manage Permissions Drawer */}
      <AnimatePresence>
        {showPermissions && (
          <>
            <div className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-40" onClick={() => setShowPermissions(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[540px] max-w-[100vw] bg-white shadow-2xl z-50 flex flex-col border-l border-[#E4E7EC]"
            >
              <div className="p-6 border-b border-[#E4E7EC] flex justify-between items-center bg-[#F8F9FB]">
                <div>
                  <h2 className="text-[18px] font-bold text-[#101828]">Manage Role Permissions</h2>
                  <p className="text-[13px] text-[#667085] mt-0.5">Configure feature capabilities per role in database</p>
                </div>
                <button onClick={() => setShowPermissions(false)} className="text-[#667085] hover:bg-[#E4E7EC] p-2 rounded-lg transition-colors">
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto bg-white space-y-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[#344054] mb-1.5">Select Role to Edit</label>
                  <select
                    value={selectedRoleForPerms}
                    onChange={(e) => setSelectedRoleForPerms(e.target.value)}
                    className="w-full bg-white border border-[#E4E7EC] rounded-xl px-4 py-2 text.sm font-semibold text-[#101828] focus:outline-none focus:border-brand-orange"
                  >
                    {roles.map(r => (
                      <option key={r.id || r.name} value={r.id || r.name}>
                        {r.label || (r.name.charAt(0).toUpperCase() + r.name.slice(1))} — {r.description || 'Custom role'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="border border-[#E4E7EC] rounded-xl p-4 bg-[#F8F9FB]/50">
                      <div className="font-bold text-[14px] text-[#101828] mb-3 flex items-center justify-between">
                        <span>{category}</span>
                        <span className="text-xs text-[#667085] font-normal">{perms.length} capabilities</span>
                      </div>
                      <div className="space-y-2">
                        {perms.map(p => {
                          const isChecked = selectedPermIds.has(p.id);
                          return (
                            <label key={p.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(p.id)}
                                className="mt-0.5 w-4 h-4 rounded text-brand-orange focus:ring-brand-orange"
                              />
                              <div>
                                <div className="text-xs font-semibold text-[#101828]">{p.name}</div>
                                <div className="text-[11px] text-[#667085]">{p.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-[#E4E7EC] bg-[#F8F9FB] flex justify-between items-center">
                <button onClick={() => setShowPermissions(false)} className="px-4 py-2.5 bg-white border border-[#E4E7EC] text-[#344054] font-semibold text-[14px] rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSaveRolePermissions}
                  disabled={savingPerms}
                  className="px-5 py-2.5 bg-brand-orange text-white font-semibold text-[14px] rounded-xl hover:bg-[#E66E00] transition-colors flex items-center gap-2"
                >
                  {savingPerms ? (
                    <>
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Role Permissions'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserManagement;
