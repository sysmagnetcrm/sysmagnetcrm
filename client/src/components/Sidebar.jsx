import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen, panel, setPanel }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [openSections, setOpenSections] = useState({ sales: true, hr: true, ops: true, support: true });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getNavItems = (userRole) => {
    const allItems = [
      { label: 'Dashboard', icon: 'mdi:view-dashboard-outline', panel: 'dashboard', roles: ['admin', 'sales', 'developer', 'finance', 'hr', 'support'] },
      { label: 'Attendance', icon: 'mdi:map-marker-outline', panel: 'attendance', roles: ['admin', 'sales', 'developer', 'hr', 'digital_marketer', 'support'] },
      { label: 'Leads', icon: 'mdi:account-group-outline', panel: 'leads', roles: ['admin', 'sales', 'digital_marketer'] },
      { label: 'Clients', icon: 'mdi:briefcase-account-outline', panel: 'clients', roles: ['admin', 'sales', 'developer', 'digital_marketer', 'support'] },
      { label: 'Tasks', icon: 'mdi:checkbox-marked-circle-outline', panel: 'tasks', roles: ['admin', 'sales', 'developer', 'hr', 'digital_marketer', 'support'] },
      { label: 'Client Portal', icon: 'mdi:web', panel: 'client_portal', roles: ['client'] },
      { label: 'Client Tasks', icon: 'mdi:clipboard-check-outline', panel: 'client_tasks', roles: ['admin'] },
      { label: 'Client Logs', icon: 'mdi:history', panel: 'client_logs', roles: ['admin'] },
      { label: 'Staff Workboard', icon: 'mdi:desktop-mac-dashboard', panel: 'staff_workboard', roles: ['developer', 'digital_marketer', 'hr', 'sales', 'finance', 'support'] },
      { label: 'HR Management', icon: 'mdi:account-tie-outline', panel: 'hr', roles: ['admin', 'hr'] },
      { label: 'Recruitment', icon: 'mdi:calendar-account-outline', panel: 'recruitment', roles: ['admin', 'sales', 'hr'] },
      { label: 'Payments', icon: 'mdi:cash-multiple', panel: 'payments', roles: ['admin', 'finance'] },
      { label: 'Payroll', icon: 'mdi:credit-card-outline', panel: 'payroll', roles: ['admin', 'hr'] },
      { label: 'Reports', icon: 'mdi:chart-bar', panel: 'reports', roles: ['admin'] },
      { label: 'Leaderboard', icon: 'mdi:trophy-outline', panel: 'leaderboard', roles: ['admin', 'sales'] },
      { label: 'QA', icon: 'mdi:bug-outline', panel: 'qa', roles: ['admin', 'support'] },
      { label: 'Automation', icon: 'mdi:robot-outline', panel: 'automation', roles: ['admin'] },
      { label: 'Portal Manager', icon: 'mdi:monitor-dashboard', panel: 'portal_manager', roles: ['admin'] },
      { label: 'Users', icon: 'mdi:account-cog-outline', panel: 'users', roles: ['admin'] },
    ];

    return allItems.filter(item => item.roles.includes(userRole));
  };

  const navItems = getNavItems(user?.role);
  const allowed = new Set(navItems.map(n => n.panel));

  const SECTIONS = [
    {
      key: 'sales',
      title: 'Sales & Marketing',
      items: [
        { label: 'Leads', panel: 'leads' },
        { label: 'Clients', panel: 'clients' },
        { label: 'Payments', panel: 'payments' },
      ],
    },
    {
      key: 'hr',
      title: 'HR & PAYROLL',
      items: [
        { label: 'Management', panel: 'hr' },
        { label: 'Attendance', panel: 'attendance' },
        { label: 'Recruitment', panel: 'recruitment' },
        { label: 'Payroll', panel: 'payroll' },
      ],
    },
    {
      key: 'ops',
      title: 'OPERATIONS',
      items: [
        { label: 'Staff Workboard', panel: 'staff_workboard' },
        { label: 'Task', panel: 'tasks' },
        { label: 'Client Task', panel: 'client_tasks' },
        { label: 'QA', panel: 'qa' },
        { label: 'Automation', panel: 'automation' },
      ],
    },
    {
      key: 'support',
      title: 'SUPPORT',
      items: [
        { label: 'Reports', panel: 'reports' },
        { label: 'Leaderboard', panel: 'leaderboard' },
        { label: 'Portal Manager', panel: 'portal_manager' },
        { label: 'Users', panel: 'users' },
      ],
    },
    {
      key: 'portal',
      title: 'CLIENT ZONE',
      items: [
        { label: 'Client Portal', panel: 'client_portal' },
      ],
    },
  ];

  const renderGroupedNav = (open = true) => (
    <div className={`mx-2 my-2 space-y-2 ${open ? '' : 'hidden'}`}>
      {/* Dashboard pill */}
      <button
        onClick={() => handleNavClick('dashboard')}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${panel === 'dashboard'
          ? 'bg-[#FE911E] text-white shadow-md shadow-[#FE911E]/20'
          : 'bg-white dark:bg-brand-black text-brand-grey hover:bg-[#FE911E]/5 hover:text-[#FE911E]'
          }`}
      >
        <Icon icon="mdi:view-dashboard-outline" className="w-4 h-4" />
        <span className="font-medium text-sm">Dashboard</span>
      </button>

      {SECTIONS.map(sec => {
        const expanded = openSections[sec.key];
        const visibleItems = sec.items.filter(it => allowed.has(it.panel));
        if (visibleItems.length === 0) return null;
        return (
          <div key={sec.key} className="bg-white dark:bg-brand-black rounded-xl p-1.5 shadow-sm border border-brand-grey/5">
            <button
              onClick={() => setOpenSections(s => ({ ...s, [sec.key]: !s[sec.key] }))}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-bold text-brand-grey uppercase tracking-wider hover:bg-brand-grey/5 transition-colors"
            >
              <span>{sec.title}</span>
              <Icon icon={expanded ? "mdi:chevron-down" : "mdi:chevron-right"} className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-0.5 space-y-0.5 px-1 pb-0.5">
                    {visibleItems.map(it => (
                      <button
                        key={it.panel}
                        onClick={() => handleNavClick(it.panel)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${panel === it.panel
                          ? 'bg-[#FE911E]/10 text-[#FE911E]'
                          : 'text-brand-black dark:text-brand-white hover:bg-brand-grey/5'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          {it.label}
                          {it.panel === 'users' && (
                            <Icon icon="mdi:lock-outline" className="w-3 h-3 text-brand-grey" title="Admin only" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Footer icons */}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white dark:bg-brand-black shadow-sm border border-brand-grey/10 text-[#FE911E] hover:shadow-md transition-all"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Icon icon={theme === 'light' ? "mdi:weather-night" : "mdi:weather-sunny"} className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-full bg-white dark:bg-brand-black shadow-sm border border-brand-grey/10 text-[#FE911E] hover:shadow-md transition-all">
          <Icon icon="mdi:cog-outline" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const handleNavClick = (navPanel) => {
    setPanel(navPanel);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Mobile overlay
  if (isMobile) {
    return (
      <>


        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              />

              {/* Sidebar */}
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed left-4 top-4 bottom-4 w-72 bg-brand-white dark:bg-brand-black rounded-[2rem] shadow-2xl z-50 overflow-y-auto border border-white/20"
              >
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-brand-grey/10">
                  <div className="font-bold text-xl text-brand-black dark:text-brand-white flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FE911E] flex items-center justify-center text-white">
                      <Icon icon="mdi:lightning-bolt" className="w-5 h-5" />
                    </div>
                    Eron-CRM
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5" />
                  </button>
                </div>

                {/* Grouped Navigation */}
                {renderGroupedNav(true)}

                {/* Footer */}
                <div className="mt-auto p-6 border-t border-brand-grey/10">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-brand-black shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-[#FE911E]/10 flex items-center justify-center text-[#FE911E] font-bold">
                      {user?.name?.charAt(0) ?? 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-brand-black dark:text-brand-white">{user?.name}</div>
                      <div className="text-xs text-brand-grey capitalize">{user?.role}</div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 260 : 80 }}
      className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 transition-all duration-300 p-3"
    >
      <div className={`h-full flex flex-col bg-brand-white dark:bg-brand-black rounded-3xl shadow-sm border border-brand-grey/10 overflow-hidden transition-all duration-300 ${sidebarOpen ? '' : 'items-center'}`}>
        {/* Header */}
        <div className={`h-16 flex items-center ${sidebarOpen ? 'px-4 justify-between' : 'justify-center'}`}>
          {sidebarOpen ? (
            <div className="font-bold text-lg text-brand-black dark:text-brand-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FE911E] flex items-center justify-center text-white shadow-lg shadow-[#FE911E]/20">
                <Icon icon="mdi:lightning-bolt" className="w-5 h-5" />
              </div>
              <span>Eron-CRM</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[#FE911E] flex items-center justify-center text-white shadow-lg shadow-[#FE911E]/20">
              <Icon icon="mdi:lightning-bolt" className="w-5 h-5" />
            </div>
          )}

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              <Icon icon="mdi:menu-open" className="w-4 h-4" />
            </button>
          )}
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4 p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Icon icon="mdi:menu" className="w-4 h-4" />
          </button>
        )}

        {/* Grouped Navigation Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {renderGroupedNav(sidebarOpen)}
        </div>

        {/* Collapsed hint */}
        {!sidebarOpen && (
          <div className="pb-4 flex flex-col items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white dark:bg-brand-black shadow-sm border border-brand-grey/10 text-[#FE911E] hover:shadow-md transition-all"
            >
              <Icon icon={theme === 'light' ? "mdi:weather-night" : "mdi:weather-sunny"} className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
