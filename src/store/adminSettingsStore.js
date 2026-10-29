import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { organization as initOrganization } from '../data/mockData';
// ------------------------------------------------------------
// Reference option lists (UI constants)
// ------------------------------------------------------------
export const TIME_ZONE_OPTIONS = [
    'UTC',
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Europe/Madrid',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Asia/Dubai',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Pacific/Auckland',
];
export const WORKING_DAY_OPTIONS = [
    { value: 'MON', label: 'Monday', short: 'Mon' },
    { value: 'TUE', label: 'Tuesday', short: 'Tue' },
    { value: 'WED', label: 'Wednesday', short: 'Wed' },
    { value: 'THU', label: 'Thursday', short: 'Thu' },
    { value: 'FRI', label: 'Friday', short: 'Fri' },
    { value: 'SAT', label: 'Saturday', short: 'Sat' },
    { value: 'SUN', label: 'Sunday', short: 'Sun' },
];
export const TEMPLATE_OPTIONS = [
    { value: 'SCRUM', label: 'Scrum', hint: 'Iterations with backlog grooming and velocity tracking' },
    { value: 'KANBAN', label: 'Kanban', hint: 'Continuous flow with WIP limits' },
    { value: 'SIMPLIFIED', label: 'Simplified', hint: 'Lightweight board for small teams' },
    { value: 'WATERFALL', label: 'Waterfall', hint: 'Phase-gated delivery with milestones' },
    { value: 'CUSTOM', label: 'Custom', hint: 'No template — configure everything manually' },
];
export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const ISSUE_TYPE_OPTIONS = [
    { value: 'INITIATIVE', label: 'Initiative' },
    { value: 'FEATURE', label: 'Feature' },
    { value: 'EPIC', label: 'Epic' },
    { value: 'STORY', label: 'Story' },
    { value: 'TASK', label: 'Task' },
    { value: 'SUB-TASK', label: 'Sub-task' },
    { value: 'BUG_FIX', label: 'Bug' },
    { value: 'IMPROVEMENT', label: 'Improvement' },
];
export const STATUS_CATEGORY_OPTIONS = ['BACKLOG', 'ACTIVE', 'REVIEW', 'BLOCKED', 'DONE'];
// ------------------------------------------------------------
// Defaults
// ------------------------------------------------------------
const detectTimeZone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }
    catch {
        return 'UTC';
    }
};
const defaultStatuses = [
    { id: 'st-todo', key: 'TODO', label: 'To Do', color: '#64748b', category: 'BACKLOG', enabled: true },
    { id: 'st-inprogress', key: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', category: 'ACTIVE', enabled: true },
    { id: 'st-inreview', key: 'IN_REVIEW', label: 'In Review', color: '#8b5cf6', category: 'REVIEW', enabled: true },
    { id: 'st-testing', key: 'TESTING', label: 'Testing', color: '#f59e0b', category: 'REVIEW', enabled: true },
    { id: 'st-bugfix', key: 'BUG_FIX', label: 'Bug Fix', color: '#ef4444', category: 'ACTIVE', enabled: true },
    { id: 'st-retest', key: 'RETEST', label: 'Retest', color: '#f97316', category: 'REVIEW', enabled: true },
    { id: 'st-blocked', key: 'BLOCKED', label: 'Blocked', color: '#dc2626', category: 'BLOCKED', enabled: true },
    { id: 'st-done', key: 'DONE', label: 'Done', color: '#10b981', category: 'DONE', enabled: true },
    { id: 'st-cancelled', key: 'CANCELLED', label: 'Cancelled', color: '#94a3b8', category: 'DONE', enabled: false },
];
const defaultPriorities = [
    { id: 'pr-low', key: 'LOW', label: 'Low', color: '#10b981', enabled: true },
    { id: 'pr-medium', key: 'MEDIUM', label: 'Medium', color: '#f59e0b', enabled: true },
    { id: 'pr-high', key: 'HIGH', label: 'High', color: '#f97316', enabled: true },
    { id: 'pr-critical', key: 'CRITICAL', label: 'Critical', color: '#ef4444', enabled: true },
];
export const DEFAULT_ADMIN_SETTINGS = {
    general: {
        organizationName: initOrganization.name,
        logoUrl: '',
        timeZone: detectTimeZone(),
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
    },
    projectDefaults: {
        template: 'SCRUM',
        workflow: 'Standard Delivery',
        defaultPriority: 'MEDIUM',
        issueTypes: ['EPIC', 'STORY', 'TASK', 'BUG_FIX', 'SUB-TASK'],
    },
    workItems: {
        statuses: defaultStatuses,
        priorities: defaultPriorities,
        labels: [
            { id: 'lbl-fast', name: 'fast-track', color: '#0d9488' },
            { id: 'lbl-tech', name: 'tech-debt', color: '#8b5cf6' },
            { id: 'lbl-cust', name: 'customer-request', color: '#f59e0b' },
        ],
        components: [
            { id: 'cmp-fe', name: 'Frontend', description: 'UI and client-side experience' },
            { id: 'cmp-be', name: 'Backend', description: 'APIs, services and server logic' },
            { id: 'cmp-db', name: 'Database', description: 'Schemas, migrations and data' },
            { id: 'cmp-docs', name: 'Documentation', description: 'Specs, guides and release notes' },
        ],
    },
    iterations: {
        defaultDuration: 2,
        durationUnit: 'WEEKS',
        rules: {
            autoNumber: true,
            requireGoal: true,
            preventOverlap: true,
            workingDaysOnly: true,
            autoCarryOver: false,
            lockCompleted: true,
        },
    },
    security: {
        sessionTimeoutMinutes: 120,
        loginPolicy: {
            minPasswordLength: 8,
            maxFailedAttempts: 5,
            lockoutMinutes: 15,
            requireMfaForAdmins: false,
            allowPasswordLogin: true,
        },
        permissionPolicy: {
            allowMemberProjectCreation: false,
            allowTlMemberManagement: true,
            restrictProfileEdits: true,
            allowExternalSharing: false,
        },
        auditRetentionDays: 180,
    },
    notifications: {
        emailEnabled: true,
        emailDigest: 'INSTANT',
        inAppEnabled: true,
        inAppShowPreviews: true,
        notifyOnAssignment: true,
        assignmentEmailCopy: true,
        dueDateReminders: true,
        dueDateLeadDays: 2,
        overdueAlerts: true,
        overdueEscalationDays: 1,
    },
};
const cloneDefaults = () => JSON.parse(JSON.stringify(DEFAULT_ADMIN_SETTINGS));
export const useAdminSettingsStore = create()(persist((set) => ({
    settings: cloneDefaults(),
    drafts: {},
    auditLog: [],
    updateSection: (key, value) => set((state) => {
        const nextDrafts = { ...state.drafts };
        delete nextDrafts[key];
        return {
            settings: { ...state.settings, [key]: value },
            drafts: nextDrafts,
        };
    }),
    setDraftSection: (key, value) => set((state) => ({ drafts: { ...state.drafts, [key]: value } })),
    discardDraft: (key) => set((state) => {
        const next = { ...state.drafts };
        delete next[key];
        return { drafts: next };
    }),
    discardAllDrafts: () => set({ drafts: {} }),
    resetSection: (key) => set((state) => {
        const next = { ...state.drafts };
        delete next[key];
        return {
            settings: { ...state.settings, [key]: cloneDefaults()[key] },
            drafts: next,
        };
    }),
    resetAll: () => set((state) => ({ settings: cloneDefaults(), drafts: {} })),
    appendAudit: (entry) => set((state) => ({
        auditLog: [
            {
                ...entry,
                id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                createdAt: new Date().toISOString(),
            },
            ...state.auditLog,
        ].slice(0, 500),
    })),
}), {
    name: 'flowexec-admin-settings',
    // Drafts are intentionally session-only; only committed settings and the
    // audit trail survive a reload.
    partialize: (state) => ({ settings: state.settings, auditLog: state.auditLog }),
}));
// ------------------------------------------------------------
// Branding selector — the single read path for org name / logo.
// Display surfaces (sidebar, topbar, dashboard) use this so the
// brand reflects Admin Settings immediately and across reloads.
// ------------------------------------------------------------
export const useOrganizationBranding = () => {
    const name = useAdminSettingsStore((s) => s.settings.general.organizationName);
    const logoUrl = useAdminSettingsStore((s) => s.settings.general.logoUrl);
    return { name: name || initOrganization.name, logoUrl };
};
/** Effective settings for a section: staged draft when present, otherwise committed. */
export const selectEffectiveSettings = (state, key) => state.drafts[key] ?? state.settings[key];
