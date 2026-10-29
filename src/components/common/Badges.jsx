import React from 'react';
import { getStatusColor, getStatusLabel, getPriorityColor, getUserStatusColor, getUserStatusLabel, getSprintStatusColor, getBugStatusColor, getBugSeverityColor, getRoleColor, getRoleLabel } from '../../utils/roleUtils';
export const StatusBadge = ({ status, resolution, plain = false }) => {
    const isCancelled = status === 'CANCELLED' || (status === 'DONE' && resolution === 'CANCELLED');
    return (<span className={plain ? 'font-medium text-[color:var(--work-item-text)]' : isCancelled ? 'badge-gray' : getStatusColor(status)}>
      {isCancelled ? 'Cancelled' : getStatusLabel(status)}
    </span>);
};
export const PriorityBadge = ({ priority, plain = false }) => (<span className={plain ? 'font-medium text-[color:var(--work-item-text)]' : getPriorityColor(priority)}>
    {priority.charAt(0) + priority.slice(1).toLowerCase()}
  </span>);
export const UserStatusBadge = ({ status }) => (<span className={getUserStatusColor(status)}>{getUserStatusLabel(status)}</span>);
export const SprintStatusBadge = ({ status }) => (<span className={getSprintStatusColor(status)}>
    {status.toUpperCase()}
  </span>);
export const BugStatusBadge = ({ status }) => (<span className={getBugStatusColor(status)}>
    {status.replace(/_/g, ' ').charAt(0) + status.replace(/_/g, ' ').slice(1).toLowerCase()}
  </span>);
export const BugSeverityBadge = ({ severity }) => (<span className={getBugSeverityColor(severity)}>
    {severity.charAt(0) + severity.slice(1).toLowerCase()}
  </span>);
export const RoleBadge = ({ role }) => (<span className={getRoleColor(role)}>{getRoleLabel(role)}</span>);
