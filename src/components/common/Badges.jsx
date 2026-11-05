import React from 'react';
import { getStatusColor, getStatusLabel, getPriorityColor, getUserStatusColor, getUserStatusLabel, getSprintStatusColor, getSprintStatusLabel, getBugStatusColor, getBugSeverityColor, getRoleColor, getRoleLabel } from '../../utils/roleUtils';

export const StatusBadge = ({ status, resolution, plain = false }) => {
    const isCancelled = status === 'CANCELLED' || (status === 'DONE' && resolution === 'CANCELLED');
    return (<span className={plain ? 'font-medium text-[color:var(--work-item-text)]' : isCancelled ? 'badge-gray' : getStatusColor(status)}>
      {isCancelled ? 'Cancelled' : getStatusLabel(status)}
    </span>);
};

export const PriorityBadge = ({ priority, plain = false }) => {
    const p = String(priority || 'LOW');
    return (<span className={plain ? 'font-medium text-[color:var(--work-item-text)]' : getPriorityColor(p)}>
      {p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()}
    </span>);
};

export const UserStatusBadge = ({ status }) => (<span className={getUserStatusColor(status)}>{getUserStatusLabel(status)}</span>);

export const SprintStatusBadge = ({ status }) => (<span className={getSprintStatusColor(status)}>
    {getSprintStatusLabel(status)}
  </span>);

export const BugStatusBadge = ({ status }) => {
    const s = String(status || 'OPEN').replace(/_/g, ' ');
    return (<span className={getBugStatusColor(status)}>
      {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
    </span>);
};

export const BugSeverityBadge = ({ severity }) => {
    const s = String(severity || 'LOW');
    return (<span className={getBugSeverityColor(s)}>
      {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
    </span>);
};

export const RoleBadge = ({ role }) => (<span className={getRoleColor(role)}>{getRoleLabel(role)}</span>);
