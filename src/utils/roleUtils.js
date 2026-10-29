export const getRoleLabel = (role) => {
    const labels = {
        ADMIN: 'Admin',
        PROJECT_MANAGER: 'Project Manager',
        TEAM_LEADER: 'Team Leader',
        MEMBER: 'Member',
    };
    return labels[role];
};
export const getRoleColor = (role) => {
    const colors = {
        ADMIN: 'badge-purple',
        PROJECT_MANAGER: 'badge-teal',
        TEAM_LEADER: 'badge-blue',
        MEMBER: 'badge-gray',
    };
    return colors[role];
};
/**
 * Who may manage custom-field DEFINITIONS (create / edit definition / delete
 * definition / reorder). Value editing follows separate per-issue rights.
 */
export const canManageCustomFields = (role) => role === 'ADMIN' || role === 'PROJECT_MANAGER';
// CANCELLED is a terminal display status (DONE + resolution CANCELLED), so
// badge helpers accept it alongside the workflow statuses.
export const getStatusColor = (status) => {
    const colors = {
        TODO: 'badge-gray',
        IN_PROGRESS: 'badge-teal',
        IN_REVIEW: 'badge-blue',
        TESTING: 'badge-amber',
        BUG_FIX: 'badge-red',
        RETEST: 'badge-orange',
        BLOCKED: 'badge-red',
        DONE: 'badge-green',
        CANCELLED: 'badge-gray',
        'IN TEAM BACKLOG': 'badge-gray',
        IMPLEMENT: 'badge-blue',
        FUNNEL: 'badge-orange',
        // Initiative workflow (issue-type specific): TO DO / IN PROGRESS / DONE hues
        BACKLOG: 'badge-gray',
        ASSESSMENT: 'badge-orange',
        ON_BOARD: 'badge-indigo',
        READY_FOR_DEVELOPMENT: 'badge-blue',
        IN_DEVELOPMENT: 'badge-teal',
        ON_HOLD: 'badge-amber',
        DEVELOPMENT_COMPLETE: 'badge-purple',
        READY_FOR_DEPLOYMENT: 'badge-indigo',
        DEPLOYMENT: 'badge-orange',
        VALIDATION: 'badge-blue',
        COMPLETED: 'badge-green',
    };
    return colors[status];
};
export const getStatusLabel = (status) => {
    const labels = {
        TODO: 'To Do',
        IN_PROGRESS: 'In Progress',
        IN_REVIEW: 'In Review',
        TESTING: 'Testing',
        BUG_FIX: 'Bug Fix',
        RETEST: 'Re-test',
        BLOCKED: 'Blocked',
        DONE: 'Done',
        CANCELLED: 'Cancelled',
        'IN TEAM BACKLOG': 'In Team Work Queue',
        IMPLEMENT: 'Implement',
        FUNNEL: 'Funnel',
        BACKLOG: 'Backlog',
        ASSESSMENT: 'Assessment',
        ON_BOARD: 'On Board',
        READY_FOR_DEVELOPMENT: 'Ready for Development',
        IN_DEVELOPMENT: 'In Development',
        ON_HOLD: 'On Hold',
        DEVELOPMENT_COMPLETE: 'Development Complete',
        READY_FOR_DEPLOYMENT: 'Ready for Deployment',
        DEPLOYMENT: 'Deployment',
        VALIDATION: 'Validation',
        COMPLETED: 'Completed',
    };
    return labels[status];
};
export const isCancelledWorkItem = (task) => task.status === 'CANCELLED' || (task.status === 'DONE' && task.resolution === 'CANCELLED');
export const displayTaskStatus = (task) => isCancelledWorkItem(task) ? 'CANCELLED' : task.status;
export const displayStatusLabel = (task) => getStatusLabel(displayTaskStatus(task));
export const displayStatusColor = (task) => getStatusColor(displayTaskStatus(task));
export const getPriorityColor = (priority) => {
    const colors = {
        LOW: 'badge-green',
        MEDIUM: 'badge-amber',
        HIGH: 'badge-orange',
        CRITICAL: 'badge-red',
    };
    return colors[priority];
};
export const getPriorityDotColor = (priority) => {
    const colors = {
        LOW: 'bg-[#10b981]',
        MEDIUM: 'bg-[#f59e0b]',
        HIGH: 'bg-[#ef4444]',
        CRITICAL: 'bg-[#dc2626]',
    };
    return colors[priority];
};
export const getUserStatusColor = (status) => {
    const colors = {
        INVITATION_PENDING: 'badge-amber',
        ACTIVE: 'badge-green',
        INACTIVE: 'badge-gray',
    };
    return colors[status];
};
export const getUserStatusLabel = (status) => {
    const labels = {
        INVITATION_PENDING: 'Invitation Pending',
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
    };
    return labels[status];
};
export const getSprintStatusLabel = (status) => {
    const labels = {
        PLANNED: 'Planned',
        PLANNING: 'Planning',
        ACTIVE: 'Active',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
    };
    return labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ') : '');
};
export const getProjectStatusLabel = (status) => {
    const labels = {
        ACTIVE: 'Active',
        PLANNING: 'Planning',
        ON_HOLD: 'On Hold',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
    };
    return labels[status] || (status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' '));
};
export const getSprintStatusColor = (status) => {
    const colors = {
        PLANNED: 'badge-gray',
        ACTIVE: 'badge-teal',
        COMPLETED: 'badge-green',
    };
    return colors[status];
};
export const getBugStatusColor = (status) => {
    const colors = {
        OPEN: 'badge-red',
        IN_PROGRESS: 'badge-amber',
        FIXED: 'badge-green',
        RETESTING: 'badge-amber',
        CLOSED: 'badge-green',
        REOPENED: 'badge-red',
    };
    return colors[status];
};
export const getBugSeverityColor = (severity) => {
    const colors = {
        LOW: 'badge-green',
        MEDIUM: 'badge-amber',
        HIGH: 'badge-orange',
        CRITICAL: 'badge-red',
    };
    return colors[severity];
};
// ---------------------------------------------------------------------------
// ADMIN FULL-ACCESS MODEL
// The ADMIN role is a true system administrator: it bypasses project
// membership, project role, team membership and normal role permissions.
// Every capability helper in this file returns true for ADMIN, so call sites
// never have to spell out the bypass themselves. Use `isAdmin(role)` for the
// membership/scoping bypasses (project lists, team lists, work-item scopes).
// ---------------------------------------------------------------------------
export const isAdmin = (role) => role === 'ADMIN';
// ---- ORGANIZATION-LEVEL CAPABILITIES ----
// Discovery vs. authorization: every role can SEE the organization-wide lists
// (View All Projects / Teams / Users). What a role is allowed to DO is decided
// by the authorization helpers below (Access Any Project, management rights).
/** View All Projects — every role sees the project list (discovery only). */
export const canViewAllProjects = (_role) => true;
/** View All Teams — every role sees the team list (discovery only). */
export const canViewAllTeams = (_role) => true;
/** View All Users — every role can view users (discovery only). */
export const canViewAllUsers = (_role) => true;
/** Access Any Project — open/manage any project regardless of membership. */
export const canAccessAnyProject = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
export const canViewAllWorkItems = (role) => isAdmin(role);
export const canViewAllIterations = (role) => isAdmin(role);
/** Organization-level (cross-project) reporting — Admin only. */
export const canViewAllReports = (role) => isAdmin(role);
export const canViewAuditLogs = (role) => isAdmin(role);
export const canManageOrganization = (role) => isAdmin(role);
// ---- PROJECT-LEVEL CAPABILITIES ----
// Admin bypasses membership everywhere; PM manages projects in its scope;
// TL manages members/roles inside its team/project scope; MEMBER is read-only
// for project administration.
export const canManageProjectMembers = (role) => isAdmin(role) || role === 'PROJECT_MANAGER' || role === 'TEAM_LEADER';
export const canManageProjectRoles = (role) => isAdmin(role) || role === 'PROJECT_MANAGER' || role === 'TEAM_LEADER';
export const canManageProjectSettings = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
export const canCreateProjects = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
export const canArchiveProjects = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
// Destructive project deletion is not part of the finalized matrix: Admin only.
export const canDeleteProjects = (role) => isAdmin(role);
// ---- USER MANAGEMENT HIERARCHY ----
// Admin manages every role. PM manages Team Leaders and Members (within its
// project scope). Team Leader manages Members (within its team/project scope).
// Member manages nobody.
/** Can this role manage at least one other user role? */
export const canManageUsers = (role) => isAdmin(role) || role === 'PROJECT_MANAGER' || role === 'TEAM_LEADER';
/** Creating/inviting users is a system-level operation — Admin only. */
export const canCreateUsers = (role) => isAdmin(role);
/** Can `actorRole` edit/manage a user holding `targetRole`? */
export const canManageUser = (actorRole, targetRole) => {
    if (!actorRole || !targetRole)
        return false;
    if (actorRole === 'ADMIN')
        return true;
    if (actorRole === 'PROJECT_MANAGER')
        return targetRole === 'TEAM_LEADER' || targetRole === 'MEMBER';
    if (actorRole === 'TEAM_LEADER')
        return targetRole === 'MEMBER';
    return false;
};
// ---- WORK ITEM CAPABILITIES (ADMIN can manage any work item, any assignee) ----
export const canManageAnyWorkItem = (role) => isAdmin(role);
export const canAssignTasks = (role) => isAdmin(role) || role === 'PROJECT_MANAGER' || role === 'TEAM_LEADER';
/**
 * Comment moderation (pinning) beyond one's own comments. Editing and
 * deleting a comment is always author-only — this only covers non-destructive
 * moderation such as pinning an important comment someone else wrote, and
 * mirrors the ADMIN/PM moderator pattern used elsewhere (file deletion).
 */
export const canModerateComments = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
export const canManageWorkflow = (role) => role === 'PROJECT_MANAGER' || isAdmin(role);
// Iteration lifecycle permissions (frontend-only, based on the authenticated user's existing role).
// TL / PM / ADMIN may manage sprint lifecycle; MEMBER is read-only for sprints.
export const canManageSprint = (role) => isAdmin(role) || role === 'PROJECT_MANAGER' || role === 'TEAM_LEADER';
export const canStartSprint = (role) => canManageSprint(role);
export const canCompleteSprint = (role) => canManageSprint(role);
export const canEditSprint = (role) => canManageSprint(role);
// Archiving: granted where the application's permission model supports it (PM/ADMIN).
export const canArchiveSprint = (role) => isAdmin(role) || role === 'PROJECT_MANAGER';
// Deletion is an admin-only, destructive action.
export const canDeleteSprint = (role) => isAdmin(role);
export const getDashboardPath = (role) => {
    const paths = {
        ADMIN: '/admin',
        PROJECT_MANAGER: '/pm',
        TEAM_LEADER: '/tl',
        MEMBER: '/member',
    };
    return paths[role];
};
export const getInitials = (name) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
// ---- FILE PERMISSIONS ----
export const canUploadFiles = (role) => {
    return true; // All authenticated roles can upload
};
export const canDeleteFile = (role, fileRecord, currentUserId) => {
    if (role === 'ADMIN')
        return true;
    if (role === 'PROJECT_MANAGER')
        return true;
    if (fileRecord.uploadedById === currentUserId)
        return true;
    return false;
};
export const canPreviewFile = (mimeType) => {
    return (mimeType.startsWith('image/') ||
        mimeType === 'application/pdf' ||
        mimeType === 'text/plain' ||
        mimeType === 'text/csv' ||
        mimeType === 'application/json');
};
export const canViewVersionHistory = (role) => {
    return true; // All authenticated roles can view version history
};
