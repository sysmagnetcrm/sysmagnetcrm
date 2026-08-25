import React from 'react';
import EronInput from './EronInput';

const CurrencyInput = ({
  label,
  value,
  onChange,
  placeholder = '50,000',
  disabled = false,
  required = false,
  error,
  className = '',
}) => {
  const formatDisplay = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return num.toLocaleString('en-IN');
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, '');
    onChange(rawVal);
  };

  return (
    <EronInput
      label={label}
      prefix="₹"
      type="text"
      disabled={disabled}
      required={required}
      value={formatDisplay(value)}
      onChange={handleInputChange}
      placeholder={placeholder}
      error={error}
      className={className}
    />
  );
};

export default CurrencyInput;
