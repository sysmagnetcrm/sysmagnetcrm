import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
  panel,
  setPanel,
}) => {
  const { user } = useAuth();
  const role = (user?.role || 'client').toLowerCase();

  // Navigation Items Grouped by Categories
  const navigationGroups = [
    {
      title: null, // Overview group (always visible, no collapsible accordion header)
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

  // State to track open/collapsed accordion categories
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

  // Auto-expand category containing active panel, ensure it stays open
  useEffect(() => {
    navigationGroups.forEach((group) => {
      if (group.title && group.items.some(item => item.id === panel)) {
        setCollapsedCategories(prev => ({
          ...prev,
          [group.title]: false // false = expanded (open)
        }));
      }
    });
  }, [panel]);

  const toggleCategory = (categoryTitle) => {
    // Check if active item is inside this category
    const group = navigationGroups.find(g => g.title === categoryTitle);
    const containsActive = group?.items.some(item => item.id === panel);

    // Don't collapse if active page is inside this category
    if (containsActive && !collapsedCategories[categoryTitle]) {
      return;
    }

    setCollapsedCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

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
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 ease-in-out shrink-0 ${
          // Mobile state vs Desktop state
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-16' : 'lg:w-60'
        } w-60`}
      >
        {/* Brand Header */}
        <div className={`h-16 px-4 flex items-center border-b border-[#E5E7EB] ${
          isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
        }`}>
          {isCollapsed ? (
            /* Collapsed State Header */
            <div className="hidden lg:flex flex-col items-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-[8px] bg-[#FF8A1F] flex items-center justify-center text-white font-bold text-base shadow-subtle">
                E
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className="group relative p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Icon icon="heroicons:chevron-double-right" className="w-4 h-4" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  Expand sidebar ( › )
                </span>
              </button>
            </div>
          ) : (
            /* Expanded State Header */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#FF8A1F] flex items-center justify-center text-white font-bold text-lg shadow-subtle shrink-0">
                  E
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-gray-900 text-base leading-tight tracking-tight truncate">Eron-CRM</span>
                  <span className="text-[10px] text-gray-400 font-medium tracking-wide truncate">ENTERPRISE SaaS</span>
                </div>
              </div>

              {/* Desktop Collapse Button */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Icon icon="heroicons:chevron-double-left" className="w-4 h-4" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-[11px] font-medium rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  Collapse sidebar ( ‹ )
                </span>
              </button>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-3">
          {navigationGroups.map((group, gIdx) => {
            // Filter items permitted for user role
            const allowedItems = group.items.filter(item => item.roles.includes(role));
            if (allowedItems.length === 0) return null;

            const isGroupCollapsed = !!collapsedCategories[group.title];
            const containsActive = group.title && group.items.some(item => item.id === panel);

            return (
              <div key={gIdx} className="space-y-1">
                {/* Category Header (Shown in Expanded State or Mobile) */}
                {group.title && (
                  <div className={isCollapsed ? 'hidden lg:block' : ''}>
                    {/* Expanded Category Header */}
                    <button
                      onClick={() => toggleCategory(group.title)}
                      disabled={containsActive && !isGroupCollapsed}
                      className={`w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider transition-colors group ${
                        containsActive ? 'cursor-default text-orange-600/80 font-bold' : 'hover:text-gray-700 cursor-pointer'
                      } ${isCollapsed ? 'lg:hidden' : ''}`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Icon
                        icon={isGroupCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'}
                        className={`w-3.5 h-3.5 transition-transform ${containsActive ? 'opacity-40' : 'opacity-60 group-hover:opacity-100'}`}
                      />
                    </button>

                    {/* Collapsed Category Divider Line */}
                    {isCollapsed && (
                      <div className="hidden lg:block my-2 border-t border-gray-100" />
                    )}
                  </div>
                )}

                {/* Items List (Hide if category accordion is collapsed in expanded mode) */}
                {(!isGroupCollapsed || isCollapsed) && (
                  <div className="space-y-1">
                    {allowedItems.map((item) => {
                      const isActive = panel === item.id;
                      return (
                        <div key={item.id} className="relative group/item">
                          <button
                            onClick={() => handleNavClick(item.id)}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`w-full flex items-center ${
                              isCollapsed ? 'lg:justify-center justify-start px-2.5' : 'px-3'
                            } py-2 rounded-[8px] text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-orange-50 text-[#FF8A1F] font-semibold border-l-4 border-[#FF8A1F]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <Icon
                              icon={item.icon}
                              className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#FF8A1F]' : 'text-gray-400 group-hover/item:text-gray-700'}`}
                            />
                            <span className={`truncate ml-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
                              {item.label}
                            </span>
                          </button>

                          {/* Floating Tooltip Popover (Visible in Collapsed Desktop State) */}
                          {isCollapsed && (
                            <div className="hidden lg:group-hover/item:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-md shadow-lg z-50 whitespace-nowrap pointer-events-none items-center gap-1.5 animate-fade-fast">
                              <span>{item.label}</span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A1F]"></span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Info Footer */}
        <div className="p-2.5 border-t border-[#E5E7EB] bg-gray-50/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center px-1' : 'px-2'} py-1.5`}>
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF8A1F] font-semibold flex items-center justify-center text-xs shrink-0 border border-orange-200">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[11px] text-gray-500 capitalize truncate font-medium">
                  {role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
