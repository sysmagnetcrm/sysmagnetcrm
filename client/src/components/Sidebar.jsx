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
      title: null, // Overview group (always visible at top)
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
        { id: 'qa', label: 'QA', icon: 'heroicons:shield-check', roles: ['admin', 'developer'] },
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

  // State to track accordion open/collapsed sections
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Rule: Auto-expand section containing current active page, preserve open state
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

    // Rule: Do NOT allow active category to collapse if current active page is inside it
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

      {/* Sidebar Container: 240px expanded, 68px collapsed */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 bg-white border-r border-[#E4E7EC] flex flex-col transition-all duration-200 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          isCollapsed ? 'lg:w-[68px]' : 'lg:w-[240px]'
        } w-[240px]`}
      >
        {/* Brand Header & Toggle */}
        <div className={`h-16 px-4 flex items-center border-b border-[#E4E7EC] ${
          isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'
        }`}>
          {isCollapsed ? (
            /* Collapsed Header */
            <div className="hidden lg:flex flex-col items-center gap-1.5 py-1">
              <div className="w-8 h-8 rounded-[8px] bg-[#FF8A1F] flex items-center justify-center text-white font-bold text-base">
                E
              </div>
              <button
                onClick={() => setIsCollapsed(false)}
                className="group relative p-1 text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded-[6px] transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Icon icon="heroicons:chevron-double-right" className="w-4 h-4" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-[6px] shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  Expand sidebar ( › )
                </span>
              </button>
            </div>
          ) : (
            /* Expanded Header */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#FF8A1F] flex items-center justify-center text-white font-bold text-base shrink-0">
                  E
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-[#111827] text-base leading-tight tracking-tight truncate">Eron-CRM</span>
                  <span className="text-[10px] text-[#98A2B3] font-medium tracking-wide truncate uppercase">ENTERPRISE SaaS</span>
                </div>
              </div>

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] rounded-[6px] transition-colors group relative"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Icon icon="heroicons:chevron-double-left" className="w-4 h-4" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-[6px] shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  Collapse sidebar ( ‹ )
                </span>
              </button>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#667085] hover:text-[#111827] p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <Icon icon="heroicons:x-mark" className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-3">
          {navigationGroups.map((group, gIdx) => {
            const allowedItems = group.items.filter(item => item.roles.includes(role));
            if (allowedItems.length === 0) return null;

            const isGroupCollapsed = !!collapsedCategories[group.title];
            const containsActive = group.title && group.items.some(item => item.id === panel);

            return (
              <div key={gIdx} className="space-y-1">
                {/* Category Header */}
                {group.title && (
                  <div className={isCollapsed ? 'hidden lg:block' : ''}>
                    <button
                      onClick={() => toggleCategory(group.title)}
                      disabled={containsActive && !isGroupCollapsed}
                      className={`w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-[#98A2B3] uppercase tracking-wider transition-colors group ${
                        containsActive ? 'cursor-default text-[#D96F0B] font-bold' : 'hover:text-[#344054] cursor-pointer'
                      } ${isCollapsed ? 'lg:hidden' : ''}`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Icon
                        icon={isGroupCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'}
                        className={`w-3.5 h-3.5 transition-transform ${containsActive ? 'opacity-40' : 'opacity-60 group-hover:opacity-100'}`}
                      />
                    </button>

                    {/* Divider line in collapsed mode */}
                    {isCollapsed && (
                      <div className="hidden lg:block my-2 border-t border-[#E4E7EC]" />
                    )}
                  </div>
                )}

                {/* Child Menu Items */}
                {(!isGroupCollapsed || isCollapsed) && (
                  <div className="space-y-1">
                    {allowedItems.map((item) => {
                      const isActive = panel === item.id;
                      return (
                        <div key={item.id} className="relative group/item">
                          <button
                            onClick={() => handleNavClick(item.id)}
                            className={`w-full flex items-center ${
                              isCollapsed ? 'lg:justify-center justify-start px-2.5' : 'px-3'
                            } py-2 rounded-[8px] text-xs font-medium transition-all ${
                              isActive
                                ? 'bg-[#FFF4E8] text-[#D96F0B] font-semibold border-l-[3px] border-[#FF8A1F]'
                                : 'text-[#344054] hover:text-[#111827] hover:bg-[#F9FAFB]'
                            }`}
                          >
                            <Icon
                              icon={item.icon}
                              className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#FF8A1F]' : 'text-[#667085] group-hover/item:text-[#111827]'}`}
                            />
                            <span className={`truncate ml-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
                              {item.label}
                            </span>
                          </button>

                          {/* Hover Tooltip in Collapsed Desktop Mode */}
                          {isCollapsed && (
                            <div className="hidden lg:group-hover/item:flex absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#111827] text-white text-xs font-medium rounded-[6px] shadow-lg z-50 whitespace-nowrap pointer-events-none items-center gap-1.5 animate-fade-fast">
                              <span>{item.label}</span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A1F]" />}
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

        {/* User Profile Footer */}
        <div className="p-2.5 border-t border-[#E4E7EC] bg-[#F9FAFB]/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center px-1' : 'px-2'} py-1`}>
            <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF8A1F] font-bold flex items-center justify-center text-xs shrink-0 border border-orange-200">
              {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#111827] truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[11px] text-[#667085] capitalize truncate font-medium">
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
