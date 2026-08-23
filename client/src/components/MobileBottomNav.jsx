import React from 'react';
import { Icon } from '@iconify/react';

const MobileBottomNav = ({ panel, setPanel, onToggleSidebar }) => {
  const items = [
    { id: 'dashboard', label: 'Home', icon: 'heroicons:squares-2x2' },
    { id: 'leads', label: 'Leads', icon: 'heroicons:user-group' },
    { id: 'clients', label: 'Clients', icon: 'heroicons:building-office-2' },
    { id: 'tasks', label: 'Tasks', icon: 'heroicons:clipboard-document-check' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] z-30 lg:hidden flex items-center justify-around px-2 shadow-card">
      {items.map((item) => {
        const isActive = panel === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setPanel(item.id)}
            className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
              isActive ? 'text-[#FF8A1F] font-semibold' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon icon={item.icon} className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
      <button
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center w-14 h-12 rounded-lg text-gray-500 hover:text-gray-800"
      >
        <Icon icon="heroicons:ellipsis-horizontal" className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
