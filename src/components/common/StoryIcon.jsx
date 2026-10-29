import React, { useId } from 'react';
/**
 * FlowExec Story icon: a folded story/page with a distinctive dog-eared
 * corner and two text lines — a recognizable “user story document” glyph,
 * not a sparkle. Shared by WorkItemIcon, TaskTypeBadge and CreateWorkItemModal.
 */
export const StoryIcon = ({ title, className = '', variant = 'default' }) => {
    const gradientId = `si-${useId().replace(/:/g, '')}`;
    const foldId = `${gradientId}-f`;
    const onColor = variant === 'onColor';
    const bodyFill = onColor ? '#FFFFFF' : `url(#${gradientId})`;
    const foldFill = onColor ? '#D1FAE5' : `url(#${foldId})`;
    const lineFill = onColor ? '#059669' : '#FFFFFF';
    return (<svg viewBox="0 0 24 24" fill="none" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={gradientId} x1="5" y1="3" x2="16" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#047857"/>
          <stop offset="0.55" stopColor="#059669"/>
          <stop offset="1" stopColor="#10B981"/>
        </linearGradient>
        <linearGradient id={foldId} x1="13" y1="3" x2="16.2" y2="7.6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6EE7B7"/>
          <stop offset="1" stopColor="#34D399"/>
        </linearGradient>
      </defs>

      {/* Folded story page — rounded body with the top-right corner turned down */}
      <path d="M13.2 3H6.6A2.6 2.6 0 0 0 4 5.6v12.8A2.6 2.6 0 0 0 6.6 21h7.6a2 2 0 0 0 2-2V7.4L13.2 3Z" fill={bodyFill}/>
      {/* Fold flap */}
      <path d="M13.2 3v3.6a1 1 0 0 0 1 1h2L13.2 3Z" fill={foldFill}/>

      {/* Two story text lines */}
      <rect x="6.8" y="10.2" width="6.4" height="1.5" rx="0.75" fill={lineFill} opacity={onColor ? 0.95 : 0.92}/>
      <rect x="6.8" y="13.6" width="4.6" height="1.5" rx="0.75" fill={lineFill} opacity={onColor ? 0.75 : 0.75}/>
    </svg>);
};
