import { trial } from '../config/siteConfig';
import { getDashboardPath } from './roleUtils';
import { matchId, matchProject } from './idUtils';
import { resolveIssueKey } from './issueKeyResolver';
/**
 * 7-Day Limited Trial access rules.
 *
 * A trial account is identified ONLY by its subscription record
 * (`user.subscription.plan === 'TRIAL'`), written when the account is created
 * through the trial sign-up — never by email or display name. Trial accounts
 * carry the existing MEMBER role, so every role gate in the app still applies
 * on top of the trial rules below.
 *
 * FRONTEND ONLY: there is no backend subscription service. These checks shape
 * the UI and client-side routing; they are not a security boundary. Anyone
 * with dev tools can edit local state, and the mock data is bundled in the
 * client. Real enforcement needs server-side subscription state and API-level
 * authorisation.
 */
export const TRIAL_PLAN = 'TRIAL';
export const TRIAL_HOME_PATH = '/trial-workspace';
/** Mirrors the Starter column of the pricing comparison (PricingPage). */
export const TRIAL_INCLUDED_FEATURES = [
    'Kanban board with drag-and-drop',
    'Work items: story, task, bug, sub-task',
    'Sprint and iteration planning',
    'Comments, mentions and notifications',
    'Project chat and activity feed',
    'Basic project dashboard',
];
/** Pro-only rows of the pricing comparison — locked for the trial. */
export const TRIAL_LOCKED_FEATURES = [
    'Gantt charts and cross-project roadmaps',
    'Team workload and capacity management',
    'Sprint burndown and velocity charts',
    'PDF report exports',
    'Project health signals and analytics',
    'Release and version management',
    'Portfolio and initiative reporting',
    'Audit log export',
];
/**
 * Project-workspace tabs that render Pro-only features from the comparison:
 * reports/burndown (Insights), Gantt timeline, release management, PDF export.
 */
export const TRIAL_LOCKED_PROJECT_TABS = ['insights', 'delivery-timeline', 'delivery-releases', 'export'];
export const isTrialUser = (user) => user?.subscription?.plan === TRIAL_PLAN;
/** Subscription record stored on a new trial account. */
export const createTrialSubscription = (now = new Date()) => ({
    plan: TRIAL_PLAN,
    startedAt: now.toISOString(),
    durationDays: trial.durationDays,
    projectIds: [trial.sampleProjectId],
});
/** Projects a trial account may open (the sample project only). */
export const getTrialProjects = (user, projects) => {
    const allowed = user?.subscription?.projectIds ?? [];
    return projects.filter((p) => allowed.includes(p.id) && !p.isArchived);
};
/** Where a signed-in user lands: the trial workspace for trial accounts, else the role dashboard. */
export const getHomePath = (user) => (isTrialUser(user) ? TRIAL_HOME_PATH : getDashboardPath(user?.role));
const ALWAYS_ALLOWED = [TRIAL_HOME_PATH, '/notifications', '/settings', '/my-todo'];
/** MEMBER route segments that are not project keys. */
const MEMBER_RESERVED = ['projects', 'tasks', 'sprint', 'bugs', 'activity'];
const decode = (segment) => {
    try {
        return decodeURIComponent(segment);
    }
    catch {
        return segment;
    }
};
/**
 * Client-side allow-list for trial accounts: the trial workspace, personal
 * pages, and the sample project's workspace / iterations / issues. Everything
 * else (other projects, org-wide queues, initiatives, activity) redirects back
 * to the trial workspace.
 */
export const isTrialPathAllowed = (pathname, user, projects, tasks) => {
    const path = pathname.replace(/\/+$/, '') || '/';
    if (ALWAYS_ALLOWED.includes(path))
        return true;
    const trialProjects = getTrialProjects(user, projects);
    const issueMatch = path.match(/^\/(?:member\/tasks|browse)\/([^/]+)$/);
    if (issueMatch) {
        const key = decode(issueMatch[1]).toLowerCase();
        return trialProjects.some((project) => tasks.some((t) => t.projectId === project.id &&
            (resolveIssueKey(project, t)?.toLowerCase() === key || matchId(t.id, key))));
    }
    const byIdMatch = path.match(/^\/member\/projects\/([^/]+)$/);
    if (byIdMatch)
        return trialProjects.some((project) => matchId(project.id, decode(byIdMatch[1])));
    const byKeyMatch = path.match(/^\/member\/([^/]+)(?:\/.*)?$/);
    if (byKeyMatch && !MEMBER_RESERVED.includes(byKeyMatch[1])) {
        const key = decode(byKeyMatch[1]);
        return trialProjects.some((project) => matchProject(project, { projectKey: key }));
    }
    return false;
};
