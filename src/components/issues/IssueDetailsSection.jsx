import React from 'react';
import { useAppStore } from '../../store/appStore';
import { StatusBadge, PriorityBadge } from '../common/Badges';
import { IssueSection } from './IssueSection';
import { IssueField, IssueChips } from './IssueField';
import { useCustomFieldRows } from './IssueCustomFields';
import { ParentLink } from './ParentLink';
import { resolveParentLink, getParentFieldLabel, getWorkItemLabel, } from '../../utils/workItemHierarchy';
import { formatDueDate } from '../../utils/dateUtils';
import { isStandardFieldShown } from '../../utils/fieldConfiguration';
import { AlertTriangle, Compass, Layers } from 'lucide-react';
const RESOLUTION_LABEL = {
    FIXED: 'Fixed',
    DONE: 'Done',
    WONT_DO: "Won't Do",
    DUPLICATE: 'Duplicate',
    CANNOT_REPRODUCE: 'Cannot Reproduce',
    CANCELLED: 'Cancelled',
};
const EPIC_STATUS_LABEL = {
    TO_DO: 'To Do',
    IN_PROGRESS: 'In Progress',
    BLOCKED: 'Blocked',
    DONE: 'Done',
};
const PLANNING_TYPES = ['INITIATIVE', 'FEATURE', 'EPIC'];
/**
 * Details grid (read-only). Fields are rendered per issue type:
 *   Initiative -> planning level fields (incl. multiple Application CIs)
 *   Feature    -> parent initiative, team, product risk
 *   Epic       -> epic name, epic status, parent feature
 *   others     -> delivery fields (type, status, due date, ...)
 *
 * Every field renders as a plain label/value row — values, badges and chips
 * only, with no inline editors, hover pencils or save/cancel affordances.
 * Parent and issue-key links still navigate (read-only navigation), and
 * custom fields render as regular rows through `useCustomFieldRows`.
 */
export const IssueDetailsSection = ({ task, onOpenIssue, defaultOpen = true, }) => {
    const { tasks, teams, projects } = useAppStore();
    const { rows: customFieldRows, modals: customFieldModals } = useCustomFieldRows(task);
    // Type-aware parent for "Parent Link": Task -> Story, Story -> Epic,
    // Epic -> Feature (see resolveParentLink). Undefined renders as "—"; a
    // parent of the wrong type is never substituted.
    const typeParent = resolveParentLink(tasks, task);
    const team = teams.find((t) => t.id === task.teamId);
    // Per-project standard-field configuration: which optional standard rows are
    // shown for this work item type. Core rows (Type/Status) always show; absent
    // config → safe defaults (all rows), so existing projects are unchanged.
    const taskProject = projects.find((p) => p.id === task.projectId);
    const showField = (key) => isStandardFieldShown(taskProject, task.type, key);
    const isPlanningItem = PLANNING_TYPES.includes(task.type);
    // ---- Field rows ----
    const fields = [];
    const leftFields = [];
    const rightFields = [];
    const typeField = (<IssueField key="type" label="Type">
      <span title={`${getWorkItemLabel(task.type)} work item`}>{getWorkItemLabel(task.type)}</span>
    </IssueField>);
    const statusField = (<IssueField key="status" label="Status">
      <StatusBadge status={task.status} resolution={task.resolution} plain/>
    </IssueField>);
    const priorityField = (<IssueField key="priority" label="Priority">
      <PriorityBadge priority={task.priority} plain/>
    </IssueField>);
    // Core rows (Type/Status) always show; optional standard rows follow the
    // per-project field configuration.
    fields.push(typeField, statusField);
    if (showField('priority'))
        fields.push(priorityField);
    if (isPlanningItem) {
        if (task.type !== 'INITIATIVE' && showField('parent')) {
            const isEpic = task.type === 'EPIC';
            fields.push(<IssueField key="parent" label={isEpic ? 'Parent Link' : getParentFieldLabel(task.type)}>
          {typeParent ? <ParentLink parent={typeParent} onOpen={onOpenIssue}/> : undefined}
        </IssueField>);
        }
        if (task.type === 'EPIC') {
            fields.push(<IssueField key="epicName" label="Epic Name">
          {task.epicName || undefined}
        </IssueField>);
            fields.push(<IssueField key="epicStatus" label="Epic Status">
          {EPIC_STATUS_LABEL[task.epicStatus || 'TO_DO']}
        </IssueField>);
        }
        if (task.type === 'FEATURE') {
            // Team is derived from the work item's team assignment — a read-only
            // business-rule field.
            if (showField('team')) {
                fields.push(<IssueField key="teamName" label="Team Name">
            {task.teamName || team?.name || undefined}
          </IssueField>);
            }
            fields.push(<IssueField key="risk" label="Product Risk">
          {task.productRisk || undefined}
        </IssueField>);
        }
    }
    // Non-planning issues (Story/Task/Bug/Sub-task) build their own left/right
    // field lists further below instead of this shared `fields` array.
    const affectsField = (<IssueField key="affects" label="Affected Releases">
      <IssueChips values={task.affectsVersions}/>
    </IssueField>);
    const componentsField = (<IssueField key="components" label="Modules">
      <IssueChips values={task.components}/>
    </IssueField>);
    const labelsField = (<IssueField key="labels" label="Tags">
      <IssueChips values={task.tags}/>
    </IssueField>);
    const fixVersionsField = (<IssueField key="fixVersions" label="Target Release">
      <IssueChips values={task.fixVersions}/>
    </IssueField>);
    const resolutionField = (<IssueField key="resolution" label="Resolution">
      {task.resolution ? RESOLUTION_LABEL[task.resolution] : 'Unresolved'}
    </IssueField>);
    if (showField('affectsVersions'))
        fields.push(affectsField);
    if (showField('components'))
        fields.push(componentsField);
    if (showField('labels'))
        fields.push(labelsField);
    if (isPlanningItem && showField('applicationCis')) {
        fields.push(<IssueField key="ci" label={task.type === 'INITIATIVE'
                ? 'Multiple Application CI (as per CMDB)'
                : 'Application CI (as per CMDB)'}>
        <IssueChips values={task.applicationCis} mono/>
      </IssueField>);
    }
    if (showField('resolution'))
        fields.push(resolutionField);
    if (showField('fixVersions'))
        fields.push(fixVersionsField);
    // Standard issues (Story / Task / Bug / Sub-task) render into two explicit
    // columns matching the Jira reference grouping; Initiative/Feature/Epic
    // detail layouts are left untouched (single auto-flowing grid above).
    // Core rows (Type/Status) always show; optional rows follow the config.
    if (!isPlanningItem) {
        const applicationCiField = (<IssueField key="ci-l" label="Application CI (as per CMDB)">
        <IssueChips values={task.applicationCis} mono/>
      </IssueField>);
        const parentField = (<IssueField key="parent-r" label="Parent Link">
        {typeParent ? <ParentLink parent={typeParent} onOpen={onOpenIssue}/> : undefined}
      </IssueField>);
        const dueField = (<IssueField key="due-r" label="Due Date">
        {task.dueDate ? (<span className="2xl:whitespace-nowrap">{formatDueDate(task.dueDate)}</span>) : undefined}
      </IssueField>);
        leftFields.push(typeField);
        if (showField('priority'))
            leftFields.push(priorityField);
        if (showField('affectsVersions'))
            leftFields.push(affectsField);
        if (showField('components'))
            leftFields.push(componentsField);
        if (showField('labels'))
            leftFields.push(labelsField);
        if (showField('applicationCis'))
            leftFields.push(applicationCiField);
        rightFields.push(statusField);
        if (showField('parent'))
            rightFields.push(parentField);
        if (showField('fixVersions'))
            rightFields.push(fixVersionsField);
        if (showField('dueDate'))
            rightFields.push(dueField);
        if (showField('resolution'))
            rightFields.push(resolutionField);
    }
    // Custom fields join the native grid as regular IssueField rows (alternating
    // across the two columns), so they read as part of the same Details list.
    const customFieldLeft = [];
    const customFieldRight = [];
    customFieldRows.forEach((row, index) => {
        (index % 2 === 0 ? customFieldLeft : customFieldRight).push(row);
    });
    return (<IssueSection title="Information" icon={<Layers className="w-3.5 h-3.5 text-[#0d9488]"/>} defaultOpen={defaultOpen} bodyClassName="space-y-2">
      {task.type === 'INITIATIVE' && (<div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-[#f0fdfa] to-[#fffbeb] border border-[#99f6e4]">
          <div className="w-6 h-6 rounded-lg bg-[#0d9488] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Compass className="w-3.5 h-3.5"/>
          </div>
          <div className="min-w-0">
            <p className="fe-label font-bold tracking-wider text-[#0f766e]">
              Top-level planning item
            </p>
            <p className="fe-label leading-relaxed mt-0.5">
              Initiatives sit above Features and Epics. Use this page to track portfolio scope,
              affected applications and the delivery progress of everything beneath it.
            </p>
          </div>
          <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-1 hidden sm:block"/>
        </div>)}

      {isPlanningItem ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {[...fields, ...customFieldRows]}
        </div>) : (
        // Row-paired single grid: every left field shares a grid row with its
        // right counterpart, so both columns stay aligned regardless of row
        // height (wrapping chips, badges). Height comes purely from content —
        // trailing right-side cells are padded with hidden placeholders on
        // desktop so extra left fields keep falling into the left column.
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          {(() => {
                const leftAll = [...leftFields, ...customFieldLeft];
                const rightAll = [...rightFields, ...customFieldRight];
                const paired = [];
                for (let i = 0; i < Math.max(leftAll.length, rightAll.length); i++) {
                    if (leftAll[i])
                        paired.push(leftAll[i]);
                    if (rightAll[i]) {
                        paired.push(rightAll[i]);
                    }
                    else {
                        paired.push(<span key={`pad-${i}`} className="hidden md:block"/>);
                    }
                }
                return paired;
            })()}
        </div>)}

      {/* Custom-field overlays slot (display:contents): kept for API
            compatibility — the hook no longer renders any modal. */}
      {customFieldModals}
    </IssueSection>);
};
