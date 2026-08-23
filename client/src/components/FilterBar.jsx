import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

const FilterBar = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  primaryFilters = [],
  advancedFilters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const popoverRef = useRef(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowAdvanced(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active chips list (excluding empty strings or 'all')
  const activeChips = Object.entries(activeFilters).filter(
    ([key, val]) => val && val !== 'all' && val !== 'All' && key !== 'search'
  );

  return (
    <div className="space-y-2.5 mb-5">
      {/* Toolbar Main Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Icon
            icon="heroicons:magnifying-glass"
            className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="saas-input pl-9 text-xs h-9"
          />
        </div>

        {/* Primary Filter Dropdowns & Advanced Filters Trigger */}
        <div className="flex items-center gap-2 flex-wrap relative" ref={popoverRef}>
          {primaryFilters.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] || 'all'}
              onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
              className="saas-input text-xs py-1.5 px-3 h-9 w-auto bg-white border-[#E4E7EC] font-medium text-[#344054]"
            >
              <option value="all">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Advanced Filters Popover Trigger */}
          {advancedFilters.length > 0 && (
            <button
              onClick={() => setShowAdvanced(prev => !prev)}
              className={`btn-secondary text-xs h-9 py-1 px-3 gap-1.5 ${
                activeChips.length > 0 ? 'border-[#FF8A1F] text-[#D96F0B] bg-[#FFF4E8]' : ''
              }`}
            >
              <Icon icon="heroicons:funnel" className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeChips.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF8A1F] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeChips.length}
                </span>
              )}
            </button>
          )}

          {/* Advanced Filters Popover Panel */}
          {showAdvanced && advancedFilters.length > 0 && (
            <div className="absolute right-0 top-11 w-64 bg-white rounded-[10px] border border-[#E4E7EC] shadow-dropdown z-30 p-4 space-y-3 animate-fade-fast">
              <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EC]">
                <h4 className="text-xs font-bold text-[#111827]">Advanced Filters</h4>
                {onClearFilters && activeChips.length > 0 && (
                  <button
                    onClick={() => {
                      onClearFilters();
                      setShowAdvanced(false);
                    }}
                    className="text-[11px] font-semibold text-[#FF8A1F] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {advancedFilters.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#344054]">{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      value={activeFilters[f.key] || 'all'}
                      onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                      className="saas-input text-xs h-8"
                    >
                      <option value="all">All</option>
                      {f.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={activeFilters[f.key] || ''}
                      onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="saas-input text-xs h-8"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips Row */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-medium text-[#667085]">Active filters:</span>
          {activeChips.map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF4E8] text-[#D96F0B] border border-[#FEDF89]/60"
            >
              <span className="capitalize">{key.replace('_', ' ')}: {val}</span>
              <button
                onClick={() => onFilterChange && onFilterChange(key, 'all')}
                className="hover:text-[#111827] ml-0.5"
              >
                ×
              </button>
            </span>
          ))}

          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-[11px] font-semibold text-[#667085] hover:text-[#111827] ml-1 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
