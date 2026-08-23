import React from 'react';

const CurrencyInput = ({
  label,
  value,
  onChange,
  placeholder = '50,000',
  disabled = false,
  required = false,
  className = '',
}) => {
  // Format numeric value for display (e.g., 50000 -> 50,000)
  const formatDisplay = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-IN');
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, ''); // Extract digits and decimal only
    onChange(rawVal);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="saas-label">
          {label} {required && <span className="text-[#F04438]">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#667085] pointer-events-none">
          ₹
        </span>
        <input
          type="text"
          disabled={disabled}
          required={required}
          value={formatDisplay(value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="saas-input pl-8 font-medium h-[42px]"
        />
      </div>
    </div>
  );
};

export default CurrencyInput;
