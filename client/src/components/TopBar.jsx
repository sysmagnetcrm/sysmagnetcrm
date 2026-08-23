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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchInputRef = useRef(null);

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

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsAPI.getAll();
        const list = res.data || [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.is_read).length);
      } catch (err) {
        // Fallback gracefully
        setNotifications([]);
      }
    };
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Handle opening search modal
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
    profile: 'Profile & Settings',
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

  return (
    <>
      <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Toggle Navigation"
          >
            <Icon icon="heroicons:bars-3" className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {titlesMap[panel] || 'Eron-CRM'}
            </h1>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-sm text-gray-400 bg-gray-50 border border-[#E5E7EB] rounded-[8px] hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-gray-400" />
              <span>Search leads, clients, tasks...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Controls & User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Search"
          >
            <Icon icon="heroicons:magnifying-glass" className="w-5 h-5" />
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 relative"
              aria-label="Notifications"
            >
              <Icon icon="heroicons:bell" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF8A1F] rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-[12px] border border-[#E5E7EB] shadow-dropdown z-50 p-4 animate-fade-fast">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Notifications</h4>
                  <span className="text-xs text-gray-500">{unreadCount} new</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs transition-colors">
                        <p className="font-semibold text-gray-900">{n.title}</p>
                        <p className="text-gray-600 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-[#E5E7EB] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF8A1F] font-bold text-xs flex items-center justify-center border border-orange-200">
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-semibold text-gray-800">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              <Icon icon="heroicons:chevron-down" className="w-4 h-4 text-gray-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-[12px] border border-[#E5E7EB] shadow-dropdown z-50 py-2 animate-fade-fast">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Logged User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-700 bg-orange-50 rounded uppercase">
                    Role: {user?.role || 'Client'}
                  </span>
                </div>

                {/* Profile Link */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                >
                  <Icon icon="heroicons:user" className="w-4 h-4 text-gray-400" />
                  <span>Profile & Settings</span>
                </button>

                {/* Role Switcher Option (if users list exists) */}
                {usersList.length > 0 && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowRoleSwitcher(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                  >
                    <Icon icon="heroicons:arrows-right-left" className="w-4 h-4 text-gray-400" />
                    <span>Switch Role View</span>
                  </button>
                )}

                <div className="border-t border-gray-100 my-1"></div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium"
                >
                  <Icon icon="heroicons:arrow-right-on-rectangle" className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="drawer-backdrop" onClick={() => setShowSearchModal(false)}></div>
          <div className="relative bg-white rounded-[16px] border border-[#E5E7EB] shadow-modal w-full max-w-xl overflow-hidden z-50 animate-fade-fast">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center gap-3">
              <Icon icon="heroicons:magnifying-glass" className="w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across leads, clients, tasks, candidates..."
                className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded bg-gray-100"
              >
                ESC
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {!q ? (
                <div className="text-center py-6 text-sm text-gray-400">
                  Type to search across all CRM entities...
                </div>
              ) : !hasResults ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  No matching records found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {/* Leads Results */}
                  {searchResults.leads.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Leads ({searchResults.leads.length})</h4>
                      <div className="space-y-1">
                        {searchResults.leads.map(l => (
                          <div
                            key={l.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              setPanel('leads');
                            }}
                            className="p-2 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center justify-between text-sm"
                          >
                            <span className="font-semibold text-gray-900">{l.name}</span>
                            <span className="text-xs text-gray-500">{l.status || 'New'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clients Results */}
                  {searchResults.clients.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Clients ({searchResults.clients.length})</h4>
                      <div className="space-y-1">
                        {searchResults.clients.map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onSelectClient(c);
                            }}
                            className="p-2 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center justify-between text-sm"
                          >
                            <span className="font-semibold text-gray-900">{c.name}</span>
                            <span className="text-xs text-gray-500">{c.contact || c.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Results */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Tasks ({searchResults.tasks.length})</h4>
                      <div className="space-y-1">
                        {searchResults.tasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setShowSearchModal(false);
                              onSelectTask(t);
                            }}
                            className="p-2 rounded-lg hover:bg-orange-50 cursor-pointer flex items-center justify-between text-sm"
                          >
                            <span className="font-semibold text-gray-900">{t.title}</span>
                            <span className="text-xs text-gray-500">{t.status}</span>
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

      {/* Role Switcher Modal (Dev / Admin feature) */}
      {showRoleSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="drawer-backdrop" onClick={() => setShowRoleSwitcher(false)}></div>
          <div className="relative bg-white rounded-[16px] border border-[#E5E7EB] shadow-modal w-full max-w-md p-6 z-50">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Select User Role Profile</h3>
            <p className="text-xs text-gray-500 mb-4">Switch active user view to test role permissions.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    setShowRoleSwitcher(false);
                  }}
                  className="w-full p-2.5 text-left rounded-lg border border-gray-200 hover:border-[#FF8A1F] hover:bg-orange-50 flex items-center justify-between text-sm transition-all"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{u.name || u.email}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 rounded capitalize">
                    {u.role || 'client'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setShowRoleSwitcher(false)} className="btn-secondary">
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
