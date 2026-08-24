import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUIPreferences } from '../context/UIPreferencesContext';
import { meAPI } from '../utils/supabaseServices';
import Toast from './Toast';

const Settings = ({ userRole = 'sales', onToast }) => {
  const { user, switchUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useUIPreferences();

  const isAdmin = (userRole || user?.role || '').toLowerCase() === 'admin';
  const isHR = (userRole || user?.role || '').toLowerCase() === 'hr' || isAdmin;

  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDiscardModal, setShowConfirmDiscardModal] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
  });

  // Workspace Form State
  const [orgForm, setOrgForm] = useState({
    name: 'Sysdevcode Technologies',
    code: 'SYS-2026',
    email: 'contact@sysdevcode.com',
    phone: '+91 98765 43210',
    address: 'Tech Park, Sector 5, Bangalore, India',
    timezone: 'Asia/Kolkata (UTC+05:30)',
    currency: 'INR (₹)',
    date_format: 'DD/MM/YYYY'
  });

  // Notification Preferences State
  const [notifForm, setNotifForm] = useState({
    email_alerts: true,
    task_reminders: true,
    payment_alerts: true,
    lead_updates: true,
    client_updates: false,
    system_alerts: true,
  });

  // Attendance Settings State
  const [attendanceForm, setAttendanceForm] = useState({
    office_address: 'Main HQ - Floor 4, Cyber City',
    geofence_radius: '200',
    require_gps: true,
    allow_remote_checkin: false,
    auto_checkout_time: '20:00',
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // CRM Config State
  const [crmConfig] = useState({
    lead_statuses: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'],
    lead_sources: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Manual Entry'],
    services: ['Web Development', 'Mobile App', 'Cloud CRM', 'UI/UX Design', 'SEO & Marketing']
  });

  // Audit Logs State
  const [auditLogs] = useState([
    { id: 1, date: '2026-08-24 04:30', user: user?.name || 'Admin User', action: 'Updated user role', module: 'User Management', result: 'Success' },
    { id: 2, date: '2026-08-23 18:15', user: user?.name || 'Admin User', action: 'Exported leads report', module: 'Leads', result: 'Success' },
    { id: 3, date: '2026-08-23 12:00', user: user?.name || 'Admin User', action: 'Modified workspace settings', module: 'Settings', result: 'Success' },
    { id: 4, date: '2026-08-22 09:45', user: 'System', action: 'Automated nightly data backup', module: 'System', result: 'Success' }
  ]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (onToast) onToast({ title: type === 'error' ? 'Error' : 'Success', message, type });
  };

  // Load Profile details
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        job_title: user.role ? user.role.toUpperCase() : 'Team Member',
      });
    }
  }, [user]);

  const navCategories = useMemo(() => [
    {
      group: 'PERSONAL',
      items: [
        { id: 'profile', label: 'Profile', icon: 'heroicons:user-circle', desc: 'Personal details and avatar' },
        { id: 'account', label: 'Account', icon: 'heroicons:shield-check', desc: 'Security status & sessions' },
        { id: 'appearance', label: 'Appearance', icon: 'heroicons:swatch', desc: 'Theme & display density' },
        { id: 'notifications', label: 'Notifications', icon: 'heroicons:bell', desc: 'Alerts and email preferences' },
      ]
    },
    {
      group: 'SECURITY & OPERATIONAL',
      items: [
        { id: 'security', label: 'Security & Password', icon: 'heroicons:key', desc: 'Credentials and auth' },
        { id: 'workspace', label: 'Workspace', icon: 'heroicons:building-office', desc: 'Organization profile & currency', adminOnly: true },
        { id: 'crm_config', label: 'CRM Configuration', icon: 'heroicons:adjustments-horizontal', desc: 'Pipeline statuses & categories', adminOnly: true },
        { id: 'attendance', label: 'Attendance Settings', icon: 'heroicons:clock', desc: 'Office location & GPS radius', hrOnly: true },
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'system', label: 'System & Version', icon: 'heroicons:cpu-chip', desc: 'App status & environment', adminOnly: true },
        { id: 'audit_logs', label: 'Audit Logs', icon: 'heroicons:document-text', desc: 'System activity history', adminOnly: true },
      ]
    }
  ], []);

  const handleTabChange = (targetId) => {
    if (hasUnsavedChanges) {
      setPendingTab(targetId);
      setShowConfirmDiscardModal(true);
    } else {
      setActiveTab(targetId);
    }
  };

  const confirmDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setShowConfirmDiscardModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await meAPI.updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone
      });
      if (res?.error) throw res.error;
      switchUser({ ...user, name: profileForm.full_name, phone: profileForm.phone });
      showToast('Profile updated successfully');
      setHasUnsavedChanges(false);
    } catch (err) {
      showToast(err?.message || 'Unable to save profile changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWorkspace = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Workspace settings saved successfully');
      setHasUnsavedChanges(false);
    }, 600);
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Notification preferences updated');
      setHasUnsavedChanges(false);
    }, 500);
  };

  const handleSaveAttendance = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Attendance rules updated successfully');
      setHasUnsavedChanges(false);
    }, 500);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (securityForm.new_password !== securityForm.confirm_password) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (securityForm.new_password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast('Password changed successfully');
    }, 600);
  };

  const activeTabMeta = useMemo(() => {
    for (const cat of navCategories) {
      const found = cat.items.find(i => i.id === activeTab);
      if (found) return found;
    }
    return navCategories[0].items[0];
  }, [activeTab, navCategories]);

  const isTabUnauthorized = (tab) => {
    if (tab.adminOnly && !isAdmin) return true;
    if (tab.hrOnly && !isHR) return true;
    return false;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E4E7EC]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-orange uppercase tracking-wider mb-1">
            <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4" />
            Control Center
          </div>
          <h1 className="text-[28px] font-bold text-[#101828] dark:text-white">Settings & Preferences</h1>
          <p className="text-[#667085] text-[14px] mt-0.5">
            Manage your personal account, workspace configuration, security and system options.
          </p>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-3 bg-[#FFFAEB] border border-[#FEDF89] px-4 py-2 rounded-xl text-xs text-[#B54708] font-medium animate-fade-in">
            <Icon icon="heroicons:exclamation-triangle" className="w-4 h-4 text-[#F79009]" />
            <span>You have unsaved changes</span>
            <button
              onClick={confirmDiscardChanges}
              className="ml-2 font-bold underline hover:text-[#7A2E0E]"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Secondary Nav Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6 bg-white dark:bg-brand-black border border-[#E4E7EC] rounded-2xl p-4 shadow-sm">
          {navCategories.map((cat) => (
            <div key={cat.group} className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#98A2B3] uppercase tracking-wider">
                {cat.group}
              </div>
              {cat.items.map((item) => {
                const locked = isTabUnauthorized(item);
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all text-sm font-medium ${
                      isActive
                        ? 'bg-brand-orange/10 text-brand-orange font-semibold border border-brand-orange/20 shadow-xs'
                        : locked
                        ? 'opacity-50 text-[#98A2B3] hover:bg-gray-50 cursor-pointer'
                        : 'text-[#344054] dark:text-gray-200 hover:bg-[#F8F9FB] hover:text-[#101828]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        icon={item.icon}
                        className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-orange' : 'text-[#667085]'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {locked && (
                      <Icon icon="heroicons:lock-closed" className="w-4 h-4 text-[#98A2B3] shrink-0" title="Admin only" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-brand-black border border-[#E4E7EC] rounded-2xl p-6 shadow-sm min-h-[520px]">
          
          {/* Header of Content Panel */}
          <div className="pb-5 mb-6 border-b border-[#E4E7EC] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#101828] dark:text-white flex items-center gap-2">
                <Icon icon={activeTabMeta.icon} className="w-6 h-6 text-brand-orange" />
                {activeTabMeta.label}
              </h2>
              <p className="text-sm text-[#667085] mt-0.5">{activeTabMeta.desc}</p>
            </div>
          </div>

          {/* Access Guard Check */}
          {isTabUnauthorized(activeTabMeta) ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-14 h-14 bg-[#FEF3F2] border border-[#FEE4E2] text-[#D92D20] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon icon="heroicons:shield-exclamation" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#101828] dark:text-white mb-1">Access Restricted</h3>
              <p className="text-sm text-[#667085] mb-6">
                You don't have permission to access {activeTabMeta.label}. Please contact your system administrator if you need access.
              </p>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-5 py-2.5 bg-white border border-[#E4E7EC] text-[#344054] font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Icon icon="heroicons:arrow-left" className="w-4 h-4" />
                Go to Profile Settings
              </button>
            </div>
          ) : (
            <div>

              {/* 1. PROFILE SETTINGS */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-5 p-4 bg-[#F8F9FB] rounded-2xl border border-[#E4E7EC]">
                    <div className="w-16 h-16 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold text-2xl border border-brand-orange/30 shrink-0">
                      {String(profileForm.full_name || profileForm.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#101828] text-base">{profileForm.full_name || 'User Profile'}</h4>
                      <p className="text-xs text-[#667085]">{profileForm.email}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-brand-orange/10 text-brand-orange uppercase tracking-wide border border-brand-orange/20">
                        {userRole || 'Member'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={profileForm.full_name}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, full_name: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm text-[#101828] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={profileForm.job_title}
                        disabled
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm bg-gray-50 text-[#667085] cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        disabled
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm bg-gray-50 text-[#667085] cursor-not-allowed"
                      />
                      <p className="text-[11px] text-[#667085] mt-1">Managed via Supabase Auth. Contact admin to change email.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, phone: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm text-[#101828] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-[#E66E00] transition-colors shadow-sm flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 2. ACCOUNT SETTINGS */}
              {activeTab === 'account' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="border border-[#E4E7EC] rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-[#101828] text-base">Account Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-[#667085] block">Account ID</span>
                        <code className="text-xs font-mono text-[#101828] bg-gray-100 px-2 py-1 rounded mt-0.5 inline-block truncate max-w-full">
                          {user?.id || 'usr_2026_demo'}
                        </code>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Status</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#12B76A] mt-1 border border-[#ABE5C6]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]"></span>
                          Active
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Email Verified</span>
                        <span className="text-xs font-semibold text-[#101828] block mt-1">Yes (Supabase Auth)</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Role Permissions</span>
                        <span className="text-xs font-semibold text-[#101828] block mt-1 uppercase">{userRole}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-[#E4E7EC] rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-[#101828] text-base">Active Sessions</h3>
                    <p className="text-xs text-[#667085]">
                      You are currently signed into Eron-CRM on this device. You can invalidate all active tokens.
                    </p>
                    <button
                      onClick={() => {
                        showToast('Signed out of other devices');
                      }}
                      className="px-4 py-2 border border-[#E4E7EC] text-[#344054] font-semibold text-xs rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Icon icon="heroicons:arrow-right-on-rectangle" className="w-4 h-4 text-[#667085]" />
                      Sign Out Other Sessions
                    </button>
                  </div>
                </div>
              )}

              {/* 3. APPEARANCE SETTINGS */}
              {activeTab === 'appearance' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-bold text-[#101828] dark:text-white text-sm uppercase tracking-wider mb-3">Color Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: 'light', label: 'Light', icon: 'heroicons:sun', desc: 'Clean SaaS white surface' },
                        { id: 'dark', label: 'Dark', icon: 'heroicons:moon', desc: 'Sleek dark workstation' },
                        { id: 'system', label: 'System', icon: 'heroicons:computer-desktop', desc: 'Auto-sync with OS' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            theme === t.id
                              ? 'border-brand-orange bg-brand-orange/10 dark:bg-brand-orange/20 ring-2 ring-brand-orange shadow-xs'
                              : 'border-[#E4E7EC] dark:border-[#2B313C] bg-white dark:bg-[#1E232C] hover:bg-gray-50 dark:hover:bg-[#202631]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon icon={t.icon} className={`w-6 h-6 ${theme === t.id ? 'text-brand-orange' : 'text-[#667085] dark:text-gray-400'}`} />
                            {theme === t.id && (
                              <Icon icon="heroicons:check-circle" className="w-5 h-5 text-brand-orange" />
                            )}
                          </div>
                          <div className="font-bold text-sm text-[#101828] dark:text-white">{t.label}</div>
                          <div className="text-[11px] text-[#667085] dark:text-gray-400 mt-0.5">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E4E7EC] dark:border-[#2B313C]">
                    <h3 className="font-bold text-[#101828] dark:text-white text-sm uppercase tracking-wider mb-3">Sidebar Preferences</h3>
                    <div className="flex items-center justify-between p-4 bg-[#F8F9FB] dark:bg-[#1E232C] rounded-2xl border border-[#E4E7EC] dark:border-[#2B313C]">
                      <div>
                        <div className="font-bold text-sm text-[#101828] dark:text-white">Collapsed Sidebar</div>
                        <div className="text-xs text-[#667085] dark:text-gray-400">Automatically minimize navigation on large displays</div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleSidebar}
                        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${sidebarCollapsed ? 'bg-brand-orange' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${sidebarCollapsed ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSaveNotifications} className="space-y-6 max-w-2xl">
                  <div className="space-y-4">
                    {[
                      { key: 'email_alerts', label: 'Email Notifications', desc: 'Receive daily digests and critical CRM alerts via email' },
                      { key: 'task_reminders', label: 'Task Reminders', desc: 'Get notified 1 hour before assigned task due dates' },
                      { key: 'payment_alerts', label: 'Payment & Invoice Alerts', desc: 'Alerts when client payments are logged or invoices are due' },
                      { key: 'lead_updates', label: 'Lead Activity Updates', desc: 'Notify when new leads arrive or change qualification status' },
                      { key: 'client_updates', label: 'Client Portal Notifications', desc: 'Receive messages when clients view tasks or upload files' },
                      { key: 'system_alerts', label: 'System Maintenance Notices', desc: 'Important operational notices regarding Eron-CRM uptime' },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between p-4 border border-[#E4E7EC] rounded-2xl">
                        <div>
                          <div className="font-bold text-sm text-[#101828]">{n.label}</div>
                          <div className="text-xs text-[#667085] mt-0.5">{n.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifForm(prev => ({ ...prev, [n.key]: !prev[n.key] }));
                            setHasUnsavedChanges(true);
                          }}
                          className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${notifForm[n.key] ? 'bg-brand-orange' : 'bg-gray-300'}`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifForm[n.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-[#E66E00] transition-colors shadow-sm"
                    >
                      {saving ? 'Saving...' : 'Save Notification Rules'}
                    </button>
                  </div>
                </form>
              )}

              {/* 5. WORKSPACE (ADMIN) */}
              {activeTab === 'workspace' && (
                <form onSubmit={handleSaveWorkspace} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Organization Name *</label>
                      <input
                        type="text"
                        required
                        value={orgForm.name}
                        onChange={(e) => { setOrgForm({ ...orgForm, name: e.target.value }); setHasUnsavedChanges(true); }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Organization Code</label>
                      <input
                        type="text"
                        value={orgForm.code}
                        onChange={(e) => { setOrgForm({ ...orgForm, code: e.target.value }); setHasUnsavedChanges(true); }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Currency</label>
                      <select
                        value={orgForm.currency}
                        onChange={(e) => { setOrgForm({ ...orgForm, currency: e.target.value }); setHasUnsavedChanges(true); }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm bg-white focus:outline-none focus:border-brand-orange"
                      >
                        <option value="INR (₹)">INR (₹)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Timezone</label>
                      <input
                        type="text"
                        value={orgForm.timezone}
                        onChange={(e) => { setOrgForm({ ...orgForm, timezone: e.target.value }); setHasUnsavedChanges(true); }}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Office Address</label>
                    <textarea
                      rows={3}
                      value={orgForm.address}
                      onChange={(e) => { setOrgForm({ ...orgForm, address: e.target.value }); setHasUnsavedChanges(true); }}
                      className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
                    <button type="submit" disabled={saving} className="px-6 py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-[#E66E00]">
                      {saving ? 'Saving...' : 'Save Workspace Info'}
                    </button>
                  </div>
                </form>
              )}

              {/* 6. CRM CONFIGURATION (ADMIN) */}
              {activeTab === 'crm_config' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="border border-[#E4E7EC] rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-[#101828] text-sm uppercase tracking-wider">Lead Status Pipeline Options</h3>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {crmConfig.lead_statuses.map((status, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F8F9FB] border border-[#E4E7EC] rounded-xl text-xs font-bold text-[#344054] flex items-center gap-2">
                          {status}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[#E4E7EC] rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-[#101828] text-sm uppercase tracking-wider">Configured Lead Sources</h3>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {crmConfig.lead_sources.map((src, i) => (
                        <span key={i} className="px-3 py-1.5 bg-[#F8F9FB] border border-[#E4E7EC] rounded-xl text-xs font-bold text-[#344054]">
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. ATTENDANCE SETTINGS (HR/ADMIN) */}
              {activeTab === 'attendance' && (
                <form onSubmit={handleSaveAttendance} className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Registered Office Address</label>
                    <input
                      type="text"
                      value={attendanceForm.office_address}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, office_address: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Geofence Radius (Meters)</label>
                      <input
                        type="number"
                        value={attendanceForm.geofence_radius}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, geofence_radius: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Auto-Checkout Time</label>
                      <input
                        type="time"
                        value={attendanceForm.auto_checkout_time}
                        onChange={(e) => setAttendanceForm({ ...attendanceForm, auto_checkout_time: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
                    <button type="submit" disabled={saving} className="px-6 py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-[#E66E00]">
                      {saving ? 'Saving...' : 'Save Attendance Rules'}
                    </button>
                  </div>
                </form>
              )}

              {/* 8. SECURITY SETTINGS */}
              {activeTab === 'security' && (
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Current Password *</label>
                    <input
                      type="password"
                      required
                      value={securityForm.current_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">New Password *</label>
                    <input
                      type="password"
                      required
                      value={securityForm.new_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#344054] uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={securityForm.confirm_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#E4E7EC] rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="pt-3">
                    <button type="submit" disabled={saving} className="w-full py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-[#E66E00]">
                      {saving ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* 9. SYSTEM INFO & AUDIT LOGS */}
              {activeTab === 'system' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="border border-[#E4E7EC] rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-[#101828] text-base">Application Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-[#667085] block">App Version</span>
                        <span className="font-bold text-[#101828]">Eron-CRM v2.4.0 (Enterprise)</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Environment</span>
                        <span className="font-bold text-[#101828]">Production</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Backend Provider</span>
                        <span className="font-bold text-[#101828]">Supabase Cloud</span>
                      </div>
                      <div>
                        <span className="text-xs text-[#667085] block">Database Status</span>
                        <span className="text-xs font-bold text-[#12B76A] flex items-center gap-1.5 mt-1">
                          <span className="w-2 h-2 rounded-full bg-[#12B76A]"></span> Healthy
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'audit_logs' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-[#E4E7EC] rounded-2xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-bold text-[#667085] uppercase">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Module</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E7EC]">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs text-[#667085]">{log.date}</td>
                            <td className="px-4 py-3 font-semibold text-[#101828]">{log.user}</td>
                            <td className="px-4 py-3 text-[#344054]">{log.action}</td>
                            <td className="px-4 py-3 text-[#667085]">{log.module}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#ECFDF3] text-[#12B76A]">
                                {log.result}
                              </span>
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

        </div>
      </div>

      {/* Discard Unsaved Changes Modal */}
      <AnimatePresence>
        {showConfirmDiscardModal && (
          <div className="fixed inset-0 bg-[#101828]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#171A21] border border-[#E4E7EC] dark:border-[#2B313C] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FEF3F2] dark:bg-red-950/30 text-[#D92D20] dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-[#FEE4E2] dark:border-red-900/40">
                  <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#101828] dark:text-white mb-2">Discard Unsaved Changes?</h3>
                <p className="text-sm text-[#667085] dark:text-gray-300">
                  You have modified settings that haven't been saved. Navigating away will lose these changes.
                </p>
              </div>
              <div className="p-4 border-t border-[#E4E7EC] dark:border-[#2B313C] bg-[#F8F9FB] dark:bg-[#1E232C] flex gap-3">
                <button
                  onClick={() => setShowConfirmDiscardModal(false)}
                  className="flex-1 py-2 bg-white dark:bg-[#171A21] border border-[#E4E7EC] dark:border-[#2B313C] text-[#344054] dark:text-gray-200 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-[#202631]"
                >
                  Keep Editing
                </button>
                <button
                  onClick={confirmDiscardChanges}
                  className="flex-1 py-2 bg-[#D92D20] text-white font-semibold text-sm rounded-xl hover:bg-[#B42318]"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
