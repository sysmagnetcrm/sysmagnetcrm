import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../utils/supabaseServices';

const TopBar = ({
  panel,
  searchQuery,
  setSearchQuery,
  setPanel,
  clients = [],
  tasks = [],
  candidates = [],
  leads = [],
  usersList = [],
  onSelectClient,
  onSelectTask,
  onSelectCandidate,
  onOpenProfile,
  onToggleSidebar,
}) => {
  const { user, logout, switchUser } = useAuth();
  const role = (user?.role || 'client').toLowerCase();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchInputRef = useRef(null);
  const createDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(e.target)) {
        setShowCreateDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsAPI.getAll();
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      } catch (err) {
        setNotifications([]);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Focus search input on modal open
  useEffect(() => {
    if (showSearchModal && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearchModal]);

  // Page titles mapping
  const titlesMap = {
    dashboard: 'Overview',
    leads: 'Sales Pipeline / Leads',
    clients: 'Clients Directory',
    payments: 'Payments & Financials',
    tasks: 'Task Management',
    admin_tasks: 'Projects Overview',
    qa: 'Quality Assurance',
    automation: 'Automation Runs',
    employees: 'Employee Directory',
    attendance: 'Attendance Tracking',
    recruitment: 'Recruitment & Hiring',
    payroll: 'Payroll Management',
    portal_manager: 'Support Tickets',
    client_portal: 'Client Portal',
    reports: 'Analytics & Reports',
    users: 'User Administration',
    settings: 'Settings & System Preferences',
    profile: 'Settings & System Preferences',
  };

  // User display name format (never show raw email address in top bar button)
  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Admin';
  };

  // Grouped search results
  const q = searchQuery.toLowerCase().trim();
  const searchResults = {
    leads: q ? leads.filter(l => (l.name || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q)) : [],
    clients: q ? clients.filter(c => (c.name || '').toLowerCase().includes(q) || (c.contact || '').toLowerCase().includes(q)) : [],
    tasks: q ? tasks.filter(t => (t.title || '').toLowerCase().includes(q)) : [],
    candidates: q ? candidates.filter(c => (c.name || '').toLowerCase().includes(q) || (c.position || '').toLowerCase().includes(q)) : [],
  };

  const hasResults = Object.values(searchResults).some(arr => arr.length > 0);

  const canCreateLeads = ['admin', 'sales', 'digital_marketer'].includes(role);
  const canCreateClients = ['admin', 'sales'].includes(role);
  const canCreateTasks = ['admin', 'sales', 'developer', 'hr'].includes(role);
  const canCreatePayments = ['admin', 'sales', 'finance'].includes(role);

  return (
    <>
      <header className="h-16 bg-white border-b border-[#E4E7EC] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile Sidebar Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden text-[#667085] hover:text-[#111827] p-1.5 rounded-[8px] hover:bg-[#F2F4F7] transition-colors"
            aria-label="Toggle Navigation"
          >
            <Icon icon="heroicons:bars-3" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-[#111827] leading-tight">
              {titlesMap[panel] || 'Overview'}
            </h1>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#98A2B3] bg-[#F9FAFB] border border-[#E4E7EC] rounded-[8px] hover:border-gray-300 hover:bg-white transition-all"
          >
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-[#98A2B3]" />
              <span>Search leads, clients, tasks...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-[#667085] bg-white border border-[#E4E7EC] rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Unified + Create Dropdown, Bell, User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="md:hidden p-2 text-[#667085] hover:text-[#111827] rounded-[8px] hover:bg-[#F2F4F7]"
            aria-label="Search"
          >
            <Icon icon="heroicons:magnifying-glass" className="w-5 h-5" />
          </button>

          {/* Unified + Create Dropdown */}
          {(canCreateLeads || canCreateClients || canCreateTasks || canCreatePayments) && (
            <div className="relative" ref={createDropdownRef}>
              <button
                onClick={() => setShowCreateDropdown(prev => !prev)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
              >
                <Icon icon="heroicons:plus" className="w-3.5 h-3.5" />
                <span className="font-semibold">Create</span>
                <Icon icon="heroicons:chevron-down" className="w-3 h-3 opacity-80" />
              </button>

              {showCreateDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-[10px] border border-[#E4E7EC] shadow-dropdown z-50 py-1 animate-fade-fast">
                  {canCreateLeads && (
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setPanel('leads');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#344054] hover:bg-[#FFF4E8] hover:text-[#D96F0B] flex items-center gap-2.5 transition-colors"
                    >
                      <Icon icon="heroicons:user-group" className="w-4 h-4 text-[#667085]" />
                      <span>New Lead</span>
                    </button>
                  )}
                  {canCreateClients && (
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setPanel('clients');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#344054] hover:bg-[#FFF4E8] hover:text-[#D96F0B] flex items-center gap-2.5 transition-colors"
                    >
                      <Icon icon="heroicons:building-office-2" className="w-4 h-4 text-[#667085]" />
                      <span>New Client</span>
                    </button>
                  )}
                  {canCreateTasks && (
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        onSelectTask && onSelectTask(null);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#344054] hover:bg-[#FFF4E8] hover:text-[#D96F0B] flex items-center gap-2.5 transition-colors"
                    >
                      <Icon icon="heroicons:clipboard-document-check" className="w-4 h-4 text-[#667085]" />
                      <span>New Task</span>
                    </button>
                  )}
                  {canCreatePayments && (
                    <button
                      onClick={() => {
                        setShowCreateDropdown(false);
                        setPanel('payments');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#344054] hover:bg-[#FFF4E8] hover:text-[#D96F0B] flex items-center gap-2.5 transition-colors"
                    >
                      <Icon icon="heroicons:credit-card" className="w-4 h-4 text-[#667085]" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notifications Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="p-2 text-[#667085] hover:text-[#111827] rounded-[8px] hover:bg-[#F2F4F7] relative transition-colors"
              aria-label="Notifications"
            >
              <Icon icon="heroicons:bell" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF8A1F] rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-[10px] border border-[#E4E7EC] shadow-dropdown z-50 p-4 animate-fade-fast">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E4E7EC] mb-2">
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider">Notifications</h4>
                  <span className="text-[11px] font-semibold text-[#D96F0B] bg-[#FFF4E8] px-2 py-0.5 rounded-full">{unreadCount} new</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#98A2B3] text-center py-6">No recent notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-[8px] bg-[#F9FAFB] hover:bg-[#F2F4F7] text-xs transition-colors">
                        <p className="font-semibold text-[#111827]">{n.title}</p>
                        <p className="text-[#667085] mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Button */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 p-1 rounded-[8px] hover:bg-[#F9FAFB] border border-transparent hover:border-[#E4E7EC] transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF8A1F] font-bold text-xs flex items-center justify-center border border-orange-200 shrink-0">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-[#111827]">
                {getDisplayName()}
              </span>
              <Icon icon="heroicons:chevron-down" className="w-3.5 h-3.5 text-[#98A2B3]" />
            </button>

            {/* Structured User Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-[10px] border border-[#E4E7EC] shadow-dropdown z-50 py-2 animate-fade-fast">
                {/* Header Profile Summary */}
                <div className="px-4 py-2.5 border-b border-[#E4E7EC] mb-1">
                  <p className="text-sm font-bold text-[#111827]">{getDisplayName()}</p>
                  <p className="text-xs text-[#667085] truncate">{user?.email || 'admin@sysdevcode.com'}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#D96F0B] bg-[#FFF4E8] rounded uppercase border border-[#FEDF89]/60">
                    Role: {user?.role || 'Admin'}
                  </span>
                </div>

                {/* Profile Links */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#F9FAFB] flex items-center gap-2.5 transition-colors"
                >
                  <Icon icon="heroicons:user" className="w-4 h-4 text-[#667085]" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#F9FAFB] flex items-center gap-2.5 transition-colors"
                >
                  <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4 text-[#667085]" />
                  <span>Preferences</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#F9FAFB] flex items-center gap-2.5 transition-colors"
                >
                  <Icon icon="heroicons:shield-check" className="w-4 h-4 text-[#667085]" />
                  <span>Security</span>
                </button>

                {usersList.length > 0 && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowRoleSwitcher(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-[#344054] hover:bg-[#F9FAFB] flex items-center gap-2.5 transition-colors"
                  >
                    <Icon icon="heroicons:arrows-right-left" className="w-4 h-4 text-[#667085]" />
                    <span>Switch Role View</span>
                  </button>
                )}

                <div className="border-t border-[#E4E7EC] my-1" />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-[#F04438] hover:bg-[#FEF3F2] flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <Icon icon="heroicons:arrow-right-on-rectangle" className="w-4 h-4 text-[#F04438]" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Center Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="drawer-backdrop" onClick={() => setShowSearchModal(false)} />
          <div className="relative bg-white rounded-[16px] border border-[#E4E7EC] shadow-modal w-full max-w-xl overflow-hidden z-50 animate-fade-fast">
            <div className="p-3 border-b border-[#E4E7EC] flex items-center gap-2 relative">
              <div className="input-leading-icon">
                <Icon icon="heroicons:magnifying-glass" className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, clients, tasks..."
                className="saas-input saas-input-icon w-full border-none focus:ring-0 text-sm"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-[10px] font-semibold text-[#667085] hover:text-[#111827] px-2 py-1 rounded bg-[#F2F4F7]"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {!q ? (
                <div className="text-center py-8 text-xs text-[#98A2B3]">
                  Search across Leads, Clients, Tasks, Employees, Tickets...
                </div>
              ) : !hasResults ? (
                <div className="text-center py-8 text-xs text-[#667085]">
                  No matching records found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Leads */}
                  {searchResults.leads.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2">Leads ({searchResults.leads.length})</h4>
                      <div className="space-y-1">
                        {searchResults.leads.map(l => (
                          <div
                            key={l.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              setPanel('leads');
                            }}
                            className="p-2.5 rounded-[8px] hover:bg-[#FFF4E8] cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-semibold text-[#111827]">{l.name}</span>
                            <span className="badge badge-info">{l.status || 'New'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clients */}
                  {searchResults.clients.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2">Clients ({searchResults.clients.length})</h4>
                      <div className="space-y-1">
                        {searchResults.clients.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onSelectClient(c);
                            }}
                            className="p-2.5 rounded-[8px] hover:bg-[#FFF4E8] cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-semibold text-[#111827]">{c.name}</span>
                            <span className="text-[#667085]">{c.contact || c.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-wider mb-2">Tasks ({searchResults.tasks.length})</h4>
                      <div className="space-y-1">
                        {searchResults.tasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onSelectTask(t);
                            }}
                            className="p-2.5 rounded-[8px] hover:bg-[#FFF4E8] cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-semibold text-[#111827]">{t.title}</span>
                            <span className="badge badge-warning">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Switcher Modal */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="drawer-backdrop" onClick={() => setShowRoleSwitcher(false)} />
          <div className="relative bg-white rounded-[16px] border border-[#E4E7EC] shadow-modal w-full max-w-md p-6 z-50">
            <h3 className="text-base font-semibold text-[#111827] mb-1">Select User Role Profile</h3>
            <p className="text-xs text-[#667085] mb-4">Switch active user view to test role permissions.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full p-2.5 text-left rounded-[8px] border border-[#E4E7EC] hover:border-[#FF8A1F] hover:bg-[#FFF4E8] flex items-center justify-between text-xs transition-all"
                >
                  <div>
                    <p className="font-semibold text-[#111827]">{u.name || u.email}</p>
                    <p className="text-[11px] text-[#667085]">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F2F4F7] rounded uppercase">
                    {u.role || 'client'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setShowRoleSwitcher(false)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
