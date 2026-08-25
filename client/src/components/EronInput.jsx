import React, { useState, forwardRef } from 'react';
import { Icon } from '@iconify/react';

const EronInput = forwardRef(({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  error,
  helperText,
  icon,
  prefix,
  suffix,
  autoComplete,
  className = '',
  inputClassName = '',
  size = 'md',
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  const effectiveType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  const hasLeftContent = Boolean(icon || prefix);
  const hasRightContent = Boolean(suffix || isPasswordType);

  const heightClasses = {
    sm: 'h-9 text-xs',
    md: 'h-11 text-sm',
    lg: 'h-12 text-base',
  }[size] || 'h-11 text-sm';

  return (
    <div className={`w-full font-sans ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-[13px] font-semibold text-[#475569] dark:text-[#CBD5E1] mb-1.5"
        >
          {label} {required && <span className="text-[#D92D20] dark:text-[#F04438]">*</span>}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {/* Left Slot: Fixed 44px container to guarantee zero overlap */}
        {hasLeftContent && (
          <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10 text-[#94A3B8] dark:text-[#7C8799]">
            {icon && (
              typeof icon === 'string' ? (
                <Icon icon={icon} className="w-5 h-5 transition-colors" />
              ) : (
                icon
              )
            )}
            {!icon && prefix && (
              <span className="text-sm font-semibold text-[#475569] dark:text-[#CBD5E1]">
                {prefix}
              </span>
            )}
          </div>
        )}

        {/* Native Input */}
        <input
          ref={ref}
          id={id || name}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          autoComplete={autoComplete}
          className={`
            w-full ${heightClasses} rounded-xl font-medium transition-all duration-150
            bg-white dark:bg-[#1E232C]
            text-[#0F172A] dark:text-[#F8FAFC]
            placeholder-[#94A3B8] dark:placeholder-[#7C8799]
            border ${error ? 'border-[#D92D20] dark:border-[#F04438] focus:ring-[#D92D20]/20' : 'border-[#CBD5E1] dark:border-[#343B48] hover:border-[#94A3B8] dark:hover:border-[#475569] focus:border-[#FF8A1F] dark:focus:border-[#FF8A1F] focus:ring-[#FF8A1F]/20'}
            focus:outline-none focus:ring-2
            disabled:bg-[#F1F5F9] dark:disabled:bg-[#171A21] disabled:opacity-60 disabled:cursor-not-allowed
            ${hasLeftContent ? 'pl-11' : 'px-3.5'}
            ${hasRightContent ? 'pr-11' : 'px-3.5'}
            ${inputClassName}
          `}
          {...rest}
        />

        {/* Right Slot: Toggle Password Eye or Custom Suffix */}
        {hasRightContent && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
            {isPasswordType ? (
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="w-10 h-10 flex items-center justify-center text-[#94A3B8] dark:text-[#7C8799] hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232832] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF8A1F]/30"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                <Icon
                  icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"}
                  className="w-5 h-5"
                />
              </button>
            ) : (
              suffix
            )}
          </div>
        )}
      </div>

      {/* Error or Helper Message */}
      {error && (
        <p className="text-xs font-medium text-[#D92D20] dark:text-[#F04438] mt-1.5 flex items-center gap-1">
          <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#94A3B8] dark:text-[#7C8799] mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  );
});

EronInput.displayName = 'EronInput';

export default EronInput;
