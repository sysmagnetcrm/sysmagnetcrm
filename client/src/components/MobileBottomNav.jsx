import React from 'react';
import { Icon } from '@iconify/react';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline', roles: ['admin', 'sales', 'developer', 'finance', 'digital_marketer', 'support'] },
  { key: 'leads', label: 'Leads', icon: 'mdi:account-box-outline', roles: ['admin', 'sales', 'digital_marketer'] },
  { key: 'clients', label: 'Clients', icon: 'mdi:account-group-outline', roles: ['admin', 'sales', 'developer', 'support'] },
  { key: 'sales', label: 'Sales', icon: 'mdi:briefcase-outline', roles: ['admin', 'sales'] },
  { key: 'tasks', label: 'Tasks', icon: 'mdi:file-document-outline', roles: ['admin', 'sales', 'developer', 'support'] },
  { key: 'payments', label: 'Payments', icon: 'mdi:currency-usd', roles: ['admin', 'finance'] },
  { key: 'recruitment', label: 'Recruit', icon: 'mdi:calendar-account-outline', roles: ['admin', 'sales'] },
  { key: 'users', label: 'Users', icon: 'mdi:account-cog-outline', roles: ['admin'] },
];

const MobileBottomNav = ({ panel, setPanel, userRole }) => {
  const items = tabs.filter(t => t.roles.includes(userRole));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-brand-grey/10 bg-white/95 dark:bg-brand-black/95 backdrop-blur-xl pb-safe">
      <div className="grid grid-cols-5 h-16">
        {items.slice(0, 5).map(({ key, label, icon }) => {
          const isActive = panel === key;
          return (
            <button
              key={key}
              onClick={() => setPanel(key)}
              className={`group relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${isActive ? 'text-[#FE911E]' : 'text-brand-grey hover:text-brand-black dark:hover:text-brand-white'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#FE911E]/10 text-[#FE911E]' : 'bg-transparent'
                }`}>
                <Icon icon={icon} className="w-5 h-5" />
              </div>
              <span className="leading-none">{label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-[#FE911E] rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
