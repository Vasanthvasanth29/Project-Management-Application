import React from 'react';
import { CalendarDays } from 'lucide-react';
import { getSprintStatusLabel } from '../../utils/roleUtils';
export const fmtIterationRange = (startIso, endIso) => {
    if (!startIso || !endIso)
        return '—';
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (isNaN(s.getTime()) || isNaN(e.getTime()))
        return '—';
    const pad = (n) => String(n).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const sDay = pad(s.getUTCDate());
    const sMon = months[s.getUTCMonth()];
    const eDay = pad(e.getUTCDate());
    const eMon = months[e.getUTCMonth()];
    return `${sDay} ${sMon} - ${eDay} ${eMon}`;
};
export const getIterationStatusBadgeClass = (status) => {
    switch (status) {
        case 'ACTIVE':
            return 'bg-[#00875a] text-white';
        case 'COMPLETED':
            return 'bg-slate-600 text-white';
        case 'PLANNED':
            return 'bg-[#0052cc] text-white';
        default:
            return 'bg-[#00875a] text-white';
    }
};
export const IterationHeader = ({ projectName, piNumber, sprintName, startDate, endDate, dateRange, status, issuesCount, daysLeft = 0, rightAction, className = '', }) => {
    const formattedRange = dateRange || fmtIterationRange(startDate, endDate);
    const badgeClass = getIterationStatusBadgeClass(status);
    const displayStatus = status || 'ACTIVE';
    return (<div className={`flex-shrink-0 pb-3 flex items-center justify-between gap-3 flex-wrap ${className}`}>
      {/* Iteration details aligned in a single horizontal row on the right side of the PI badge */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <div className="text-[11px] font-semibold text-[#6b778c] truncate leading-tight flex-shrink-0">
          {projectName}
        </div>
        {piNumber !== undefined && (<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f0fdfa] border border-[#99f6e4] text-[10px] font-bold text-[#0f766e] flex-shrink-0">
            PI {piNumber}
          </span>)}
        <h2 className="text-base font-bold text-[#1f1f1f] truncate min-w-0 inline-flex items-center">
          {sprintName}
          {formattedRange && formattedRange !== '—' && (<span className="ml-1.5 text-[13px] font-semibold text-[#42526e]">
              [{formattedRange}]
            </span>)}
        </h2>
        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md shadow-2xs flex-shrink-0 ${badgeClass}`}>
          {getSprintStatusLabel(displayStatus)}
        </span>
        <span className="text-xs font-semibold text-[#6b778c] flex-shrink-0">
          {issuesCount} issue{issuesCount === 1 ? '' : 's'}
        </span>
        <span className="text-[#d0d1d4] flex-shrink-0">|</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b778c] flex-shrink-0">
          <CalendarDays className="w-3.5 h-3.5"/>
          {daysLeft} day{daysLeft === 1 ? '' : 's'} left
        </span>
      </div>

      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>);
};
