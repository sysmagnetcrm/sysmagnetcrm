import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

const CustomSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);

  // Selected Option Object
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Determine smart upward vs downward placement when opening
  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(options.length * 40 + 16, 220);
      // If space below is less than dropdown height, open upward
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
    setIsOpen(prev => !prev);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Navigation Handler
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

  // Sync focused index with selected option on open
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex(opt => String(opt.value) === String(value));
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
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
        className={`w-full h-[42px] px-3.5 bg-white border text-left flex items-center justify-between rounded-[8px] transition-all text-xs ${
          isOpen ? 'border-[#FF8A1F] ring-2 ring-[#FF8A1F]/20' : 'border-[#D0D5DD] hover:border-gray-400'
        } ${disabled ? 'bg-[#F2F4F7] text-[#98A2B3] cursor-not-allowed' : 'text-[#101828] cursor-pointer'}`}
      >
        <span className={`truncate font-medium ${!selectedOption ? 'text-[#98A2B3]' : 'text-[#101828]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon
          icon={isOpen ? 'heroicons:chevron-up' : 'heroicons:chevron-down'}
          className={`w-4 h-4 text-[#667085] shrink-0 transition-transform ${isOpen ? 'text-[#FF8A1F]' : ''}`}
        />
      </button>

      {/* Floating Listbox Panel */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 bg-white border border-[#D0D5DD] rounded-[8px] shadow-dropdown py-1 max-h-56 overflow-y-auto animate-fade-fast ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#98A2B3] text-center">No options</div>
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
                  className={`px-3.5 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#FFF4E8] text-[#D96F0B] font-semibold'
                      : isFocused
                      ? 'bg-[#F9FAFB] text-[#101828]'
                      : 'text-[#344054]'
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

export default CustomSelect;
