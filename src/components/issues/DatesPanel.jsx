import React from 'react';
import { CalendarDays } from 'lucide-react';
import { IssueSection } from './IssueSection';
import { IssueField } from './IssueField';
import { formatDate, formatFullDateTime, formatDueDate } from '../../utils/dateUtils';
/** Created / Updated / Resolved / Due date for an issue. */
export const DatesPanel = ({ task, defaultOpen = true }) => {
    const resolvedAt = task.resolvedAt || (task.status === 'DONE' ? task.completedAt : undefined);
    return (<IssueSection title="Dates" icon={<CalendarDays className="w-3.5 h-3.5 text-[#0d9488]"/>} defaultOpen={defaultOpen} bodyClassName="space-y-2">
      <IssueField label="Created">{formatFullDateTime(task.createdAt)}</IssueField>
      <IssueField label="Updated">{formatFullDateTime(task.updatedAt || task.createdAt)}</IssueField>
      <IssueField label="Resolved">
        {resolvedAt ? formatDate(resolvedAt) : 'Not resolved'}
      </IssueField>
      <IssueField label="Due Date">
        <span className="2xl:whitespace-nowrap">{formatDueDate(task.dueDate)}</span>
      </IssueField>
    </IssueSection>);
};
