import React from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen, panel, setPanel }) => {
  const { user } = useAuth();
  const role = (user?.role || 'client').toLowerCase();

  // Navigation Items Grouped by Categories
  const navigationGroups = [
    {
      title: null, // Overview group
      items: [
        { id: 'dashboard', label: 'Overview', icon: 'heroicons:squares-2x2', roles: ['admin', 'sales', 'developer', 'hr', 'finance', 'client', 'digital_marketer'] },
      ]
    },
    {
      title: 'SALES',
      items: [
        { id: 'leads', label: 'Leads', icon: 'heroicons:user-group', roles: ['admin', 'sales', 'digital_marketer'] },
        { id: 'clients', label: 'Clients', icon: 'heroicons:building-office-2', roles: ['admin', 'sales', 'hr', 'finance'] },
        { id: 'payments', label: 'Payments', icon: 'heroicons:credit-card', roles: ['admin', 'sales', 'finance'] },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'tasks', label: 'Tasks', icon: 'heroicons:clipboard-document-check', roles: ['admin', 'sales', 'developer', 'hr', 'digital_marketer'] },
        { id: 'admin_tasks', label: 'Projects', icon: 'heroicons:folder-open', roles: ['admin', 'developer'] },
        { id: 'qa', label: 'QA', icon: 'heroicons:check-badge', roles: ['admin', 'developer'] },
        { id: 'automation', label: 'Automation', icon: 'heroicons:bolt', roles: ['admin', 'developer'] },
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { id: 'employees', label: 'Employees', icon: 'heroicons:users', roles: ['admin', 'hr'] },
        { id: 'attendance', label: 'Attendance', icon: 'heroicons:clock', roles: ['admin', 'hr', 'developer', 'sales'] },
        { id: 'recruitment', label: 'Recruitment', icon: 'heroicons:user-plus', roles: ['admin', 'hr'] },
        { id: 'payroll', label: 'Payroll', icon: 'heroicons:banknotes', roles: ['admin', 'hr', 'finance'] },
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'portal_manager', label: 'Tickets', icon: 'heroicons:ticket', roles: ['admin', 'sales', 'developer', 'hr'] },
        { id: 'client_portal', label: 'My Portal', icon: 'heroicons:rectangle-group', roles: ['client'] },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { id: 'reports', label: 'Reports', icon: 'heroicons:chart-bar', roles: ['admin', 'sales', 'finance'] },
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { id: 'users', label: 'Users', icon: 'heroicons:user-circle', roles: ['admin'] },
        { id: 'profile', label: 'Settings', icon: 'heroicons:cog-6-tooth', roles: ['admin', 'sales', 'developer', 'hr', 'finance', 'client', 'digital_marketer'] },
      ]
    }
  ];

  const handleNavClick = (itemId) => {
    setPanel(itemId);
    // On mobile, close sidebar after clicking nav item
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-60 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#FF8A1F] flex items-center justify-center text-white font-bold text-lg shadow-subtle">
              E
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-base leading-tight tracking-tight">Eron-CRM</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">ENTERPRISE SaaS</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close sidebar"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navigationGroups.map((group, gIdx) => {
            // Filter items permitted for user role
            const allowedItems = group.items.filter(item => item.roles.includes(role));
            if (allowedItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {group.title && (
                  <h4 className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    {group.title}
                  </h4>
                )}
                {allowedItems.map((item) => {
                  const isActive = panel === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-orange-50 text-[#FF8A1F] font-semibold border-l-4 border-[#FF8A1F]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon
                        icon={item.icon}
                        className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#FF8A1F]' : 'text-gray-400'}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Info Footer */}
        <div className="p-3 border-t border-[#E5E7EB] bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF8A1F] font-semibold flex items-center justify-center text-xs shrink-0 border border-orange-200">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[11px] text-gray-500 capitalize truncate font-medium">
                {role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
