import React from 'react';

const PageHeader = ({
  category = '',
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  importActionLabel,
  onImportAction,
  exportActionLabel,
  onExportAction,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E4E7EC] mb-5">
      <div>
        {category && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3] block mb-1">
            {category}
          </span>
        )}
        <h2 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[#667085] mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {children}
        {importActionLabel && onImportAction && (
          <button onClick={onImportAction} className="btn-secondary">
            <span>{importActionLabel}</span>
          </button>
        )}
        {exportActionLabel && onExportAction && (
          <button onClick={onExportAction} className="btn-secondary">
            <span>{exportActionLabel}</span>
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button onClick={onSecondaryAction} className="btn-secondary">
            <span>{secondaryActionLabel}</span>
          </button>
        )}
        {primaryActionLabel && onPrimaryAction && (
          <button onClick={onPrimaryAction} className="btn-primary">
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
