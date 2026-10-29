import React, { useId } from 'react';
/**
 * FlowExec Task icon: a recognizable checklist / to-do glyph — rounded
 * clipboard outline with three check rows (two checked, one open). Shared
 * by WorkItemIcon, TaskTypeBadge and CreateWorkItemModal. NOT a sparkle.
 */
export const StoryTaskIcon = ({ title, className = '', variant = 'default' }) => {
    const gradientId = `tti-${useId().replace(/:/g, '')}`;
    const onColor = variant === 'onColor';
    const bodyFill = onColor ? '#FFFFFF' : `url(#${gradientId})`;
    const stroke = onColor ? '#2563eb' : '#FFFFFF';
    const lineFill = onColor ? '#2563eb' : '#FFFFFF';
    return (<svg viewBox="0 0 24 24" fill="none" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gradientId} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d4ed8"/>
          <stop offset="1" stopColor="#2563eb"/>
        </linearGradient>
      </defs>

      {/* Clipboard body */}
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill={bodyFill}/>
      {/* Clip at top */}
      <rect x="8.5" y="2" width="7" height="3.5" rx="1.2" fill={bodyFill} stroke={onColor ? '#2563eb' : '#FFFFFF'} strokeWidth="0.9"/>

      {/* Check row 1 (checked) */}
      <path d="M7.2 9.2l1.5 1.5 2.8-2.8" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="12.8" y="8.2" width="4.2" height="1.4" rx="0.7" fill={lineFill} opacity="0.9"/>

      {/* Check row 2 (checked) */}
      <path d="M7.2 13.7l1.5 1.5 2.8-2.8" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="12.8" y="12.7" width="4.2" height="1.4" rx="0.7" fill={lineFill} opacity="0.9"/>

      {/* Check row 3 (open) */}
      <rect x="7" y="16.8" width="2.2" height="2.2" rx="0.6" fill="none" stroke={stroke} strokeWidth="1.3"/>
      <rect x="11" y="17.2" width="6" height="1.4" rx="0.7" fill={lineFill} opacity="0.75"/>
    </svg>);
};
