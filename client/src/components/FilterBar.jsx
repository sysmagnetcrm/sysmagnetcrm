import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import EronSelect from './EronSelect';

const FilterBar = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search leads by company, contact or email...',
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

  // Compute active chips list
  const activeChips = Object.entries(activeFilters).filter(
    ([key, val]) => val && val !== 'all' && val !== 'All' && key !== 'search'
  );

  return (
    <div className="space-y-2 mb-4">
      {/* Single Cohesive Horizontal Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input (Flex 1, 42px Height, 40px left padding via saas-input-icon) */}
        <div className="relative flex-1">
          <div className="input-leading-icon">
            <Icon icon="heroicons:magnifying-glass" className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="saas-input saas-input-icon text-xs h-[42px]"
          />
        </div>

        {/* Inline EronSelect Primary Filters & Advanced Filters Trigger */}
        <div className="flex items-center gap-2 flex-wrap relative" ref={popoverRef}>
          {primaryFilters.map((f) => (
            <EronSelect
              key={f.key}
              value={activeFilters[f.key] || 'all'}
              onChange={(val) => onFilterChange && onFilterChange(f.key, val)}
              placeholder={`${f.label}: All`}
              width="w-[140px]"
              options={[
                { value: 'all', label: `${f.label}: All` },
                ...f.options,
              ]}
            />
          ))}

          {/* Advanced Filters Popover Trigger */}
          {advancedFilters.length > 0 && (
            <button
              onClick={() => setShowAdvanced(prev => !prev)}
              className={`btn-secondary h-[42px] px-3.5 text-xs gap-1.5 min-w-[100px] ${
                activeChips.length > 0 ? 'border-[#FF8A1F] text-[#C95F0A] bg-[#FFF4E8]' : ''
              }`}
            >
              <Icon icon="heroicons:funnel" className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeChips.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FF8A1F] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {activeChips.length}
                </span>
              )}
            </button>
          )}

          {/* Advanced Filters Popover Panel */}
          {showAdvanced && advancedFilters.length > 0 && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-[8px] border border-[#D0D5DD] shadow-dropdown z-50 p-4 space-y-3 animate-fade-fast">
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
                  {f.type === 'select' ? (
                    <EronSelect
                      label={f.label}
                      value={activeFilters[f.key] || 'all'}
                      onChange={(val) => onFilterChange && onFilterChange(f.key, val)}
                      placeholder="All"
                      options={[
                        { value: 'all', label: 'All' },
                        ...f.options,
                      ]}
                    />
                  ) : (
                    <div>
                      <label className="saas-label">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        value={activeFilters[f.key] || ''}
                        onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="saas-input h-[42px] text-xs"
                      />
                    </div>
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
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF4E8] text-[#C95F0A] border border-[#FEDF89]/60"
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
