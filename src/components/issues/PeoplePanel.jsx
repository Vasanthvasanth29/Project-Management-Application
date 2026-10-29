import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, User as UserIcon, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { getAssignableUsers } from '../../utils/assignableUsers';
import { canAssignTasks } from '../../utils/roleUtils';
import { Avatar } from '../common/Avatar';
import { IssueSection } from './IssueSection';
import { IssueField } from './IssueField';
import { AssigneePickerPanel } from './AssigneePicker';
/** Assignee / Reporter / Team / Votes / Watchers for an issue.
 *  The Assignee value opens a member picker (project members + Unassigned,
 *  with search for large lists) for users holding the "Assign / Reassign
 *  Work" permission — `canAssignTasks`; everyone else sees it read-only.
 *  Votes and Watchers remain display-only. */
export const PeoplePanel = ({ task, defaultOpen = true }) => {
    const { users, teams, projects, assignTask, updateTask } = useAppStore();
    const { currentUser } = useAuthStore();
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const assigneeRef = useRef(null);
    const project = projects.find((p) => p.id === task.projectId);
    const assignee = users.find((u) => u.id === task.assigneeId);
    const reporter = users.find((u) => u.id === (task.reporterId || task.createdById));
    const team = teams.find((t) => t.id === task.teamId);
    const voterIds = task.voterIds || [];
    const watcherIds = task.watcherIds || [];
    // Exactly the people the assignee dropdown may offer: every member of the
    // project's teams plus its project manager (single shared source).
    const assigneeCandidates = useMemo(() => getAssignableUsers(users, teams, project).filter((u) => u.status === 'ACTIVE'), [users, teams, project]);
    const canAssign = currentUser ? canAssignTasks(currentUser.role) : false;
    // Keyboard/outside-click dismissal for the open picker.
    useEffect(() => {
        if (!assigneeOpen)
            return;
        const onPointerDown = (e) => {
            if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
                setAssigneeOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape')
                setAssigneeOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [assigneeOpen]);
    const handleAssign = (userId) => {
        setAssigneeOpen(false);
        if (!currentUser)
            return;
        if (!userId) {
            if (!task.assigneeId)
                return;
            updateTask(task.id, { assigneeId: undefined }, currentUser.id);
            toast.success('Unassigned');
            return;
        }
        if (userId === task.assigneeId)
            return;
        assignTask(task.id, userId, currentUser.id);
        toast.success(`Assigned to ${users.find((u) => u.id === userId)?.name ?? 'member'}`);
    };
    const person = (user, fallback) => user ? (<span className="inline-flex items-center gap-2 min-w-0">
        <Avatar name={user.name} color={user.avatarColor} size="sm"/>
        <span className="truncate">{user.name}</span>
      </span>) : (<span className="text-[#343A40] font-normal italic">{fallback}</span>);
    return (<IssueSection title="People" icon={<Users className="w-3.5 h-3.5 text-[#0d9488]"/>} defaultOpen={defaultOpen} bodyClassName="space-y-2">
      <div className="relative" ref={assigneeRef}>
        <IssueField label="Assignee" onEdit={canAssign ? () => setAssigneeOpen((v) => !v) : undefined}>
          {person(assignee, 'Unassigned')}
        </IssueField>
        {assigneeOpen && (<AssigneePickerPanel members={assigneeCandidates} value={task.assigneeId} onSelect={handleAssign}/>)}
      </div>

      <IssueField label="Reporter">{person(reporter, 'Unknown')}</IssueField>

      {(task.type !== 'INITIATIVE' && (team || task.teamName)) && (<IssueField label="Team">
          {team ? (<span className="inline-flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: team.color || '#0d9488' }}>
                {team.name.charAt(0)}
              </span>
              <span className="truncate">{task.teamName || team.name}</span>
            </span>) : (task.teamName)}
        </IssueField>)}

      <div className="pt-1 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="fe-label">Votes</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg fe-control border bg-white border-slate-200 text-[#343A40]">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-400"/>
            <span>{voterIds.length}</span>
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="fe-label">Watchers</span>
            <span className="fe-meta">{watcherIds.length} watching</span>
          </div>

          {watcherIds.length > 0 ? (<div className="flex items-center gap-1 flex-wrap pt-0.5">
              {watcherIds.slice(0, 6).map((id) => {
                const watcher = users.find((u) => u.id === id);
                return watcher ? (<Avatar key={id} name={watcher.name} color={watcher.avatarColor} size="xs"/>) : null;
            })}
              <span className="fe-meta ml-1">{watcherIds.length} watching</span>
            </div>) : (<p className="fe-meta flex items-center gap-1">
              <UserIcon className="w-3 h-3"/> No one is watching yet
            </p>)}
        </div>
      </div>
    </IssueSection>);
};
