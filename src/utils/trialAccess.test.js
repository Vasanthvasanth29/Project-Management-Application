import { describe, it, expect } from 'vitest';
import { projects, tasks } from '../data/mockData';
import { createTrialSubscription, getHomePath, getTrialProjects, isTrialPathAllowed, isTrialUser, TRIAL_HOME_PATH, TRIAL_LOCKED_PROJECT_TABS, } from './trialAccess';
import { getProjectUrl } from './idUtils';
import { issuePath } from './issueUrl';
const trialUser = { id: 'u-reg-1', role: 'MEMBER', name: 'Trial Person', email: 'trial@example.com', subscription: createTrialSubscription(new Date('2026-10-01T09:00:00Z')) };
const admin = { id: 'u-admin-01', role: 'ADMIN', name: 'Sarah Mitchell', email: 'admin@demo.com' };
const member = { id: 'u-m-01', role: 'MEMBER', name: 'Priya Patel', email: 'member@demo.com' };
const sample = projects.find((p) => p.id === 'proj-001');
const other = projects.find((p) => p.id !== 'proj-001');
const allowed = (path, user = trialUser) => isTrialPathAllowed(path, user, projects, tasks);
describe('trial identification', () => {
    it('uses the subscription record, never the email or name', () => {
        expect(isTrialUser(trialUser)).toBe(true);
        expect(isTrialUser({ ...admin, email: 'trial@demo.com', name: 'Trial User' })).toBe(false);
        expect(isTrialUser(member)).toBe(false);
        expect(isTrialUser(null)).toBe(false);
    });
    it('records a 7-day TRIAL subscription limited to the sample project', () => {
        expect(trialUser.subscription).toEqual({
            plan: 'TRIAL',
            startedAt: '2026-10-01T09:00:00.000Z',
            durationDays: 7,
            projectIds: ['proj-001'],
        });
    });
});
describe('landing path', () => {
    it('sends trial accounts to the trial workspace and everyone else to their role dashboard', () => {
        expect(getHomePath(trialUser)).toBe(TRIAL_HOME_PATH);
        expect(getHomePath(admin)).toBe('/admin');
        expect(getHomePath(member)).toBe('/member');
        expect(getHomePath({ role: 'PROJECT_MANAGER' })).toBe('/pm');
    });
});
describe('trial path allow-list', () => {
    it('allows the trial workspace, personal pages and the sample project', () => {
        expect(getTrialProjects(trialUser, projects).map((p) => p.id)).toEqual(['proj-001']);
        expect(allowed('/trial-workspace')).toBe(true);
        expect(allowed('/notifications')).toBe(true);
        expect(allowed('/settings')).toBe(true);
        expect(allowed(getProjectUrl(sample, 'MEMBER'))).toBe(true);
        expect(allowed(`${getProjectUrl(sample, 'MEMBER')}/iterations`)).toBe(true);
        expect(allowed('/member/projects/proj-001')).toBe(true);
    });
    it('allows only issues that belong to the sample project', () => {
        const sampleTask = tasks.find((t) => t.projectId === sample.id);
        const otherTask = tasks.find((t) => t.projectId === other.id);
        expect(allowed(issuePath(sampleTask))).toBe(true);
        expect(allowed(issuePath(otherTask))).toBe(false);
    });
    it('blocks admin controls, other projects and org-wide pages', () => {
        for (const path of ['/admin', '/admin/users', '/admin/roles', '/admin/settings', '/pm', '/tl/tasks',
            '/pm/initiatives', '/pm/roadmap', '/member', '/member/projects', '/member/tasks', '/member/activity',
            getProjectUrl(other, 'MEMBER'), `/member/projects/${other.id}`]) {
            expect(allowed(path), path).toBe(false);
        }
    });
    it('locks only the Pro-only project tabs from the pricing comparison', () => {
        expect(TRIAL_LOCKED_PROJECT_TABS).toEqual(['insights', 'delivery-timeline', 'delivery-releases', 'export']);
    });
});
