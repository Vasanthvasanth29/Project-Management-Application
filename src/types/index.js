// ============================================================
// ENUMS
// ============================================================
export const ACTIVITY_TYPE_OPTIONS = [
    { value: 'TASK_CREATED', label: 'Task Created', category: 'Task' },
    { value: 'TASK_UPDATED', label: 'Task Updated', category: 'Task' },
    { value: 'STATUS_CHANGED', label: 'Status Changed', category: 'Task' },
    { value: 'ASSIGNMENT_CHANGED', label: 'Assignment Changed', category: 'Task' },
    { value: 'COMMENT_ADDED', label: 'Comment Added', category: 'Task' },
    { value: 'SPRINT_STARTED', label: 'Iteration Started', category: 'Iteration' },
    { value: 'SPRINT_COMPLETED', label: 'Iteration Completed', category: 'Iteration' },
    { value: 'RELEASE_CREATED', label: 'Release Created', category: 'Release' },
    { value: 'RELEASE_UPDATED', label: 'Release Updated', category: 'Release' },
    { value: 'DEPENDENCY_ADDED', label: 'Dependency Added', category: 'Dependency' },
    { value: 'DEPENDENCY_REMOVED', label: 'Dependency Removed', category: 'Dependency' },
    { value: 'APPROVAL_REQUESTED', label: 'Approval Requested', category: 'Approval' },
    { value: 'APPROVAL_APPROVED', label: 'Approval Approved', category: 'Approval' },
    { value: 'APPROVAL_REJECTED', label: 'Approval Rejected', category: 'Approval' },
    { value: 'USER_CREATED', label: 'User Created', category: 'Team' },
    { value: 'USER_UPDATED', label: 'User Updated', category: 'Team' },
    { value: 'PROJECT_CREATED', label: 'Project Created', category: 'Project' },
    { value: 'PROJECT_UPDATED', label: 'Project Updated', category: 'Project' },
    { value: 'BUG_CREATED', label: 'Bug Created', category: 'Bug' },
    { value: 'BUG_UPDATED', label: 'Bug Updated', category: 'Bug' },
    { value: 'OTHER', label: 'Other', category: 'Other' },
];
export * from './sso';
export * from './chat';
