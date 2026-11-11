import React from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { getDashboardPath } from '../utils/roleUtils';
import { isTrialUser, isTrialPathAllowed, TRIAL_HOME_PATH } from '../utils/trialAccess';
// Layout
import { AppShell } from '../components/layout/AppShell';
// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
// Public marketing site (FlowExec SaaS website)
import { MarketingLayout } from '../pages/marketing/MarketingLayout';
import { HomePage } from '../pages/marketing/HomePage';
import { PricingPage } from '../pages/marketing/PricingPage';
import { CheckoutPage } from '../pages/marketing/CheckoutPage';
import { ContactPage } from '../pages/marketing/ContactPage';
import { TermsPage } from '../pages/marketing/TermsPage';
import { PrivacyPage } from '../pages/marketing/PrivacyPage';
import { RefundsPage } from '../pages/marketing/RefundsPage';
import { TrialPage } from '../pages/marketing/TrialPage';
import { TrialDashboard } from '../pages/trial/TrialDashboard';
import { usePlanStore, getPlanHomePath } from '../store/planStore';
import { TrialDashboardPage } from '../pages/trial/TrialDashboardPage';
import { TrialProjectsPage } from '../pages/trial/TrialProjectsPage';
import { TrialTasksPage } from '../pages/trial/TrialTasksPage';
import { TrialIterationsPage } from '../pages/trial/TrialIterationsPage';
import { TrialReportsPage } from '../pages/trial/TrialReportsPage';
import { TrialHelpPage } from '../pages/trial/TrialHelpPage';
// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UsersPage } from '../pages/admin/UsersPage';
import { AdminProjectsPage } from '../pages/admin/AdminProjectsPage';
import { ProjectFieldConfigPage } from '../pages/admin/ProjectFieldConfigPage';
import { RolesPermissionsPage } from '../pages/admin/RolesPermissionsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
// PM Pages
import { PMDashboard } from '../pages/pm/PMDashboard';
import { PMProjectsPage } from '../pages/pm/PMProjectsPage';
import { ProjectWorkspace } from '../pages/pm/ProjectWorkspace';
import { CrossProjectRoadmap } from '../pages/pm/CrossProjectRoadmap';
import { ProjectHealthPage } from '../pages/pm/projectHealth/ProjectHealthPage';
import { SprintDetailPage } from '../pages/pm/SprintDetailPage';
import { IterationsModuleRoute } from '../pages/pm/IterationsModuleRoute';
import { IssueSearchPage } from '../pages/pm/IssueSearchPage';
import { IssueDetailsPage } from '../pages/pm/IssueDetailsPage';
// Initiative Management
import { InitiativesPage } from '../pages/initiatives/InitiativesPage';
import { InitiativeDetailPage } from '../pages/initiatives/InitiativeDetailPage';
// TL Pages
import { TLDashboard } from '../pages/tl/TLDashboard';
import { TeamPage } from '../pages/tl/TeamPage';
// Member Pages
import { MemberDashboard } from '../pages/member/MemberDashboard';
import { MemberProjectsPage } from '../pages/member/MemberProjectsPage';
import { MyTasksPage } from '../pages/member/MyTasksPage';
import { MySprintPage } from '../pages/member/MySprintPage';
import { TasksListPage } from '../pages/shared/TasksListPage';
import { NotificationsPage } from '../pages/shared/NotificationsPage';
import { ActivityPage } from '../pages/shared/ActivityPage';
import { TodoPage } from '../pages/shared/TodoPage';
import { SettingsPage } from '../pages/shared/SettingsPage';
import { BugsPage } from '../pages/shared/BugsPage';
import { BugDetailPage } from '../pages/shared/BugDetailPage';
import { FlaggedTasksPage } from '../pages/shared/FlaggedTasksPage';
import { PIIterationsPage } from '../pages/pm/PIIterationsPage';
// Guard Component
// ADMIN is a full-access system administrator: it bypasses every role gate so
// an admin can open any route regardless of allowedRoles.
const ProtectedRoute = ({ allowedRoles, children, }) => {
    const { currentUser, isAuthenticated } = useAuthStore();
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles &&
        currentUser.role !== 'ADMIN' &&
        !allowedRoles.includes(currentUser.role)) {
        return <Navigate to={getDashboardPath(currentUser.role)} replace />;
    }
    return <>{children}</>;
};
const TrialOnlyRoute = ({ children }) => {
    const { currentUser } = useAuthStore();
    if (!isTrialUser(currentUser)) {
        return <Navigate to={getDashboardPath(currentUser.role)} replace />;
    }
    return <>{children}</>;
};
/**
 * Element for the root path. It replaces the plain ProtectedRoute wrapper so
 * the public FlowExec homepage can live at `/`:
 *   - signed-in users keep the original behaviour (AppShell + index redirect
 *     to their role dashboard);
 *   - signed-out visitors landing on the exact root see the marketing
 *     homepage instead of being bounced straight to /login;
 *   - signed-out visitors on ANY other protected path keep the original
 *     redirect to /login.
 * Every other route above/below is untouched.
 */
const RootRoute = () => {
    const { currentUser, isAuthenticated } = useAuthStore();
    const projects = useAppStore((s) => s.projects);
    const tasks = useAppStore((s) => s.tasks);
    const location = useLocation();
    if (isAuthenticated && currentUser) {
        // Trial accounts only reach the trial workspace and the sample project
        // (client-side only — see utils/trialAccess). Other users are unaffected.
        if (isTrialUser(currentUser) &&
            !isTrialPathAllowed(location.pathname, currentUser, projects, tasks)) {
            return <Navigate to={TRIAL_HOME_PATH} replace />;
        }
        return <AppShell />;
    }
    if (location.pathname === '/') {
        return (<MarketingLayout>
            <HomePage />
        </MarketingLayout>);
    }
    return <Navigate to="/login" replace />;
};
const RedirectAgileIterationsRoute = () => {
    const { currentUser } = useAuthStore();
    const { projectKey, projectName } = useParams();
    const location = useLocation();
    const rolePrefix = currentUser?.role === 'ADMIN' ? 'admin' : currentUser?.role === 'TEAM_LEADER' ? 'tl' : currentUser?.role === 'MEMBER' ? 'member' : 'pm';
    const key = projectKey || 'ECOMM4.0';
    const name = projectName || 'e-commerce-platform';
    const iterIdx = location.pathname.indexOf('/iterations');
    const tail = iterIdx >= 0 ? location.pathname.slice(iterIdx) : '/iterations';
    return <Navigate to={`/${rolePrefix}/${encodeURIComponent(key)}/${name}${tail}${location.search}`} replace />;
};

const IndexRedirect = () => {
    const { currentUser } = useAuthStore();
    const { currentPlan } = usePlanStore();
    return <Navigate to={getPlanHomePath(currentUser, currentPlan)} replace />;
};

const UnifiedDashboard = () => {
    const { currentPlan } = usePlanStore();
    const { currentUser } = useAuthStore();
    if (currentPlan === 'TRIAL') {
        return <TrialDashboardPage />;
    }
    if (currentUser?.role === 'ADMIN') return <AdminDashboard />;
    if (currentUser?.role === 'PROJECT_MANAGER') return <PMDashboard />;
    if (currentUser?.role === 'TEAM_LEADER') return <TLDashboard />;
    return <MemberDashboard />;
};

const UnifiedProjects = () => {
    const { currentPlan } = usePlanStore();
    const { currentUser } = useAuthStore();
    if (currentPlan === 'TRIAL') return <TrialProjectsPage />;
    if (currentUser?.role === 'ADMIN') return <AdminProjectsPage />;
    if (currentUser?.role === 'PROJECT_MANAGER') return <PMProjectsPage />;
    return <MemberProjectsPage />;
};

const UnifiedTasks = () => {
    const { currentPlan } = usePlanStore();
    if (currentPlan === 'TRIAL') return <TrialTasksPage />;
    return <TasksListPage />;
};

const UnifiedIterations = () => {
    const { currentPlan } = usePlanStore();
    if (currentPlan === 'TRIAL') return <TrialIterationsPage />;
    return <RedirectAgileIterationsRoute />;
};

const UnifiedReports = () => {
    const { currentPlan } = usePlanStore();
    if (currentPlan === 'TRIAL') return <TrialReportsPage />;
    return <ActivityPage />;
};

export const AppRoutes = () => {
    const { isAuthenticated, currentUser } = useAuthStore();
    const { currentPlan } = usePlanStore();
    return (<Routes>
        {/* Public / Auth */}
        <Route path="/login" element={isAuthenticated && currentUser ? (<Navigate to={getPlanHomePath(currentUser, currentPlan)} replace />) : (<LoginPage />)} />
        <Route path="/register" element={<Navigate to="/login" replace />} />

        {/* Public marketing site (FlowExec) — no authentication required */}
        <Route path="/pricing" element={<MarketingLayout>
            <PricingPage />
        </MarketingLayout>} />
        <Route path="/checkout" element={<MarketingLayout>
            <CheckoutPage />
        </MarketingLayout>} />
        <Route path="/terms" element={<MarketingLayout>
            <TermsPage />
        </MarketingLayout>} />
        <Route path="/privacy" element={<MarketingLayout>
            <PrivacyPage />
        </MarketingLayout>} />
        <Route path="/refunds" element={<MarketingLayout>
            <RefundsPage />
        </MarketingLayout>} />
        <Route path="/contact" element={<MarketingLayout>
            <ContactPage />
        </MarketingLayout>} />
        {/* 7-Day Limited Trial — separate from "Get Started Free" (/register) */}
        <Route path="/trial" element={<MarketingLayout>
            <TrialPage />
        </MarketingLayout>} />

        {/* Protected App Routes */}
        <Route path="/" element={<RootRoute />}>
            {/* Program Increments → "Open iterations" */}
            <Route path="pi-iterations" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <PIIterationsPage />
            </ProtectedRoute>} />
            <Route path="pi-iterations/:piId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <PIIterationsPage />
            </ProtectedRoute>} />
            <Route path="pi-iterations/:piId/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />
            <Route path="pi-iterations/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />

            {/* AGILE / OPEN ITERATIONS ROUTES */}
            <Route path="agile/pi-iterations" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <PIIterationsPage />
            </ProtectedRoute>} />
            <Route path="agile/pi-iterations/:piId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <PIIterationsPage />
            </ProtectedRoute>} />
            <Route path="agile/pi-iterations/:piId/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />
            <Route path="agile/pi-iterations/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />
            <Route path="agile/:projectKey/iterations/*" element={<RedirectAgileIterationsRoute />} />
            <Route path="agile/:projectKey/:projectName/iterations/*" element={<RedirectAgileIterationsRoute />} />
            <Route path="agile/iterations/*" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />

            {/* Unified Plan-aware Routes (Free Trial & Pro Pack) */}
            <Route path="dashboard" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} />
            <Route path="projects" element={<ProtectedRoute><UnifiedProjects /></ProtectedRoute>} />
            <Route path="tasks" element={<ProtectedRoute><UnifiedTasks /></ProtectedRoute>} />
            <Route path="iterations" element={<ProtectedRoute><UnifiedIterations /></ProtectedRoute>} />
            <Route path="iterations/*" element={<ProtectedRoute><UnifiedIterations /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><UnifiedReports /></ProtectedRoute>} />
            <Route path="help" element={<ProtectedRoute><TrialHelpPage /></ProtectedRoute>} />
            <Route path="upgrade" element={<ProtectedRoute><TrialDashboardPage /></ProtectedRoute>} />

            <Route index element={<IndexRedirect />} />

            {/* 7-DAY LIMITED TRIAL — trial accounts only; everyone else goes to their dashboard */}
            <Route path="trial-workspace" element={<ProtectedRoute>
                <TrialOnlyRoute>
                    <TrialDashboard />
                </TrialOnlyRoute>
            </ProtectedRoute>} />

            {/* ADMIN ROUTES */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
            </ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}>
                <UsersPage />
            </ProtectedRoute>} />
            <Route path="admin/projects" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminProjectsPage />
            </ProtectedRoute>} />
            <Route path="admin/roles" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <RolesPermissionsPage />
            </ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSettingsPage />
            </ProtectedRoute>} />
            <Route path="admin/projects/:projectId" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="admin/projects/:projectId/fields" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectFieldConfigPage />
            </ProtectedRoute>} />
            <Route path="admin/:projectKey/iterations/*" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="admin/:projectKey/:projectName/iterations/*" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="admin/:projectKey/:projectName" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="admin/:projectKey" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="admin/bugs" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <BugsPage />
            </ProtectedRoute>} />
            <Route path="admin/bugs/:bugId" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <BugDetailPage />
            </ProtectedRoute>} />
            <Route path="admin/activity" element={<ProtectedRoute allowedRoles={['ADMIN']}>
                <ActivityPage />
            </ProtectedRoute>} />

            {/* PROJECT MANAGER ROUTES */}
            <Route path="pm" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <PMDashboard />
            </ProtectedRoute>} />
            <Route path="pm/projects" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <PMProjectsPage />
            </ProtectedRoute>} />
            <Route path="pm/projects/:projectId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="pm/projects/:projectId/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />
            <Route path="pm/:projectKey/:projectName/sprints/:sprintId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <SprintDetailPage />
            </ProtectedRoute>} />
            <Route path="pm/:projectKey/iterations/*" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="pm/:projectKey/:projectName/iterations/*" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="pm/:projectKey/:projectName" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="pm/:projectKey" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="pm/project-health" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'ADMIN']}>
                <ProjectHealthPage />
            </ProtectedRoute>} />
            <Route path="pm/roadmap" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'ADMIN']}>
                <CrossProjectRoadmap />
            </ProtectedRoute>} />
            {/* Initiative Management — PM/TL/ADMIN manage; MEMBER is read-only
            (mutation controls are gated inside the pages by role helpers). */}
            <Route path="pm/initiatives" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <InitiativesPage />
            </ProtectedRoute>} />
            <Route path="pm/initiatives/:initiativeId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER', 'ADMIN']}>
                <InitiativeDetailPage />
            </ProtectedRoute>} />
            <Route path="pm/bugs" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <BugsPage />
            </ProtectedRoute>} />
            <Route path="pm/bugs/:bugId" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <BugDetailPage />
            </ProtectedRoute>} />
            <Route path="pm/activity" element={<ProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']}>
                <ActivityPage />
            </ProtectedRoute>} />
            <Route path="pm/issues/search" element={<ProtectedRoute>
                <IssueSearchPage />
            </ProtectedRoute>} />

            {/* TEAM LEADER ROUTES */}
            <Route path="tl" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <TLDashboard />
            </ProtectedRoute>} />
            <Route path="tl/projects" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <PMProjectsPage />
            </ProtectedRoute>} />
            <Route path="tl/projects/:projectId" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="tl/:projectKey/iterations/*" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="tl/:projectKey/:projectName/iterations/*" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="tl/:projectKey/:projectName" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="tl/:projectKey" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="tl/team" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'PROJECT_MANAGER', 'ADMIN']}>
                <TeamPage />
            </ProtectedRoute>} />
            <Route path="tl/tasks" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'PROJECT_MANAGER', 'MEMBER', 'ADMIN']}>
                <TasksListPage />
            </ProtectedRoute>} />
            <Route path="tl/tasks/:issueKey" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'PROJECT_MANAGER', 'MEMBER', 'ADMIN']}>
                <IssueDetailsPage />
            </ProtectedRoute>} />
            <Route path="tl/bugs" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'PROJECT_MANAGER', 'ADMIN']}>
                <BugsPage />
            </ProtectedRoute>} />
            <Route path="tl/bugs/:bugId" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <BugDetailPage />
            </ProtectedRoute>} />
            <Route path="tl/activity" element={<ProtectedRoute allowedRoles={['TEAM_LEADER', 'ADMIN']}>
                <ActivityPage />
            </ProtectedRoute>} />

            {/* MEMBER ROUTES */}
            <Route path="member" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberDashboard />
            </ProtectedRoute>} />
            <Route path="member/projects" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MemberProjectsPage />
            </ProtectedRoute>} />
            <Route path="member/projects/:projectId" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="member/:projectKey/iterations/*" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="member/:projectKey/:projectName/iterations/*" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <IterationsModuleRoute />
            </ProtectedRoute>} />
            <Route path="member/:projectKey/:projectName" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="member/:projectKey" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <ProjectWorkspace />
            </ProtectedRoute>} />
            <Route path="member/tasks" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MyTasksPage />
            </ProtectedRoute>} />
            {/* Issue entry point (My Tasks, My Iteration, Iterations, Live Iteration,
            search, dashboards, notifications, activity ...). The URL carries
            the public issue key (e.g. /member/tasks/ECOMM-500); legacy
            internal-id URLs still resolve. It renders the SAME canonical
            issue-detail component as /browse/:issueKey. */}
            <Route path="member/tasks/:issueKey" element={<ProtectedRoute>
                <IssueDetailsPage />
            </ProtectedRoute>} />
            {/* Canonical Jira-style issue details page, reachable by any role. */}
            <Route path="browse/:issueKey" element={<ProtectedRoute>
                <IssueDetailsPage />
            </ProtectedRoute>} />
            <Route path="member/sprint" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <MySprintPage />
            </ProtectedRoute>} />
            <Route path="member/bugs" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <BugsPage />
            </ProtectedRoute>} />
            <Route path="member/bugs/:bugId" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <BugDetailPage />
            </ProtectedRoute>} />
            <Route path="member/activity" element={<ProtectedRoute allowedRoles={['MEMBER', 'ADMIN']}>
                <ActivityPage />
            </ProtectedRoute>} />

            {/* SHARED ROUTES */}
            <Route path="flagged-tasks" element={<FlaggedTasksPage />} />
            <Route path="bookmarks" element={<FlaggedTasksPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="my-todo" element={<TodoPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="bugs" element={<ProtectedRoute>
                <BugsPage />
            </ProtectedRoute>} />
            <Route path="bugs/:bugId" element={<ProtectedRoute>
                <BugDetailPage />
            </ProtectedRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>);
};
