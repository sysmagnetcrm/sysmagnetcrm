import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

const EronSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  required = false,
  className = '',
  width = 'w-full',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(options.length * 38 + 12, 220);
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && options[focusedIndex]) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
        } else {
          toggleOpen();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          toggleOpen();
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          toggleOpen();
          setFocusedIndex(options.length - 1);
        } else {
          setFocusedIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(opt => String(opt.value) === String(value));
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  return (
    <div className={`relative ${width} ${className}`} ref={containerRef}>
      {label && (
        <label className="saas-label">
          {label} {required && <span className="text-[#F04438]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full h-[42px] px-3 saas-input-trailing bg-white dark:bg-[#1E232C] border text-left flex items-center justify-between rounded-[8px] transition-all text-xs ${
          isOpen ? 'border-[#FF8A1F] ring-2 ring-[#FF8A1F]/20' : 'border-[#D0D5DD] dark:border-[#343B48] hover:border-gray-400'
        } ${disabled ? 'bg-[#F2F4F7] dark:bg-[#1E232C]/50 text-[#98A2B3] cursor-not-allowed' : 'text-[#101828] dark:text-white cursor-pointer'}`}
      >
        <span className={`truncate font-medium ${!selectedOption ? 'text-[#98A2B3] dark:text-gray-400' : 'text-[#101828] dark:text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          icon={isOpen ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
          className={`w-4 h-4 text-[#667085] dark:text-gray-400 shrink-0 transition-transform ${isOpen ? 'text-[#FF8A1F]' : ''}`}
        />
      </button>

      {/* Floating Dropdown Listbox Panel */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 bg-white dark:bg-[#171A21] border border-[#D0D5DD] dark:border-[#2B313C] rounded-[8px] shadow-dropdown py-1 max-h-56 overflow-y-auto animate-fade-fast ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#98A2B3] dark:text-gray-400 text-center">No options</div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isFocused = idx === focusedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#FFF4E8] dark:bg-brand-orange/15 text-[#C95F0A] dark:text-brand-orange font-semibold'
                      : isFocused
                      ? 'bg-[#F9FAFB] dark:bg-[#202631] text-[#101828] dark:text-white'
                      : 'text-[#344054] dark:text-gray-200'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Icon icon="heroicons:check" className="w-4 h-4 text-[#FF8A1F] shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default EronSelect;
