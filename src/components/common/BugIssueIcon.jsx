import React, { useId } from 'react';
/**
 * FlowExec Bug icon: rounded capsule body, six legs, two antennae, center
 * exclamation. `variant="onColor"` renders pure white so it reads on the
 * solid red WorkItemIcon tile; default stays red for light badges.
 */
export const BugIssueIcon = ({ title, className = '', variant = 'default' }) => {
    const gradientId = `bii-${useId().replace(/:/g, '')}`;
    const bodyFill = variant === 'onColor' ? '#FFFFFF' : `url(#${gradientId})`;
    const stroke = variant === 'onColor' ? '#FFFFFF' : `url(#${gradientId})`;
    const markFill = variant === 'onColor' ? '#dc2626' : '#FFFFFF';
    return (<svg viewBox="0 0 24 24" fill="none" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      {variant === 'default' && (<defs>
          <linearGradient id={gradientId} x1="6" y1="5" x2="18" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#DC2626"/>
            <stop offset="1" stopColor="#B91C1C"/>
          </linearGradient>
        </defs>)}

      {/* Antennae + legs */}
      <g stroke={stroke} strokeWidth="1.7" strokeLinecap="round" fill="none">
        <path d="M10.3 7.2C9.5 6 8.7 5.3 7.7 4.9"/>
        <path d="M13.7 7.2C14.5 6 15.3 5.3 16.3 4.9"/>
        <path d="M7.6 10.8 4.5 9.2"/>
        <path d="M7.1 13.6 3.9 13.6"/>
        <path d="M7.6 16.4 4.5 18"/>
        <path d="M16.4 10.8 19.5 9.2"/>
        <path d="M16.9 13.6 20.1 13.6"/>
        <path d="M16.4 16.4 19.5 18"/>
      </g>

      {/* Body */}
      <rect x="7" y="6.9" width="10" height="13.2" rx="5" fill={bodyFill}/>

      {/* Exclamation mark */}
      <rect x="11.15" y="9.7" width="1.7" height="4.6" rx="0.85" fill={markFill}/>
      <circle cx="12" cy="16.4" r="1.05" fill={markFill}/>
    </svg>);
};
