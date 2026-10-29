import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
/**
 * Collapsible card used by every issue detail panel so Initiative / Feature /
 * Epic pages share one consistent shell.
 */
export const IssueSection = ({ title, icon, meta, action, defaultOpen = true, collapsible = true, children, className = '', bodyClassName = '', accent = 'default', }) => {
    const [open, setOpen] = useState(defaultOpen);
    const accentText = accent === 'brand' ? 'text-[#0d9488]' : accent === 'accent' ? 'text-[#d97706]' : 'text-[#343A40]';
    return (<section className={`bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden shadow-fe-xs ${className}`}>
      <div className="px-3 py-2 bg-[#f8fafc] border-b border-[#e2e5ea] flex items-center justify-between gap-1.5">
        <button type="button" onClick={() => collapsible && setOpen(!open)} className={`flex items-center gap-1.5 text-left min-w-0 ${collapsible ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
          {collapsible &&
            (open ? (<ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0"/>) : (<ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0"/>))}
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <h3 className={`fe-heading tracking-wider font-display truncate ${accentText}`}>
            {title}
          </h3>
          {meta && <span className="flex-shrink-0">{meta}</span>}
        </button>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {action}
        </div>
      </div>

      {open && <div className={`p-3 ${bodyClassName}`}>{children}</div>}
    </section>);
};
