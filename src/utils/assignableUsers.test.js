import { describe, it, expect } from 'vitest';
import { getAssignableUsers } from './assignableUsers';
const user = (id) => ({ id });
const team = (id, memberIds) => ({ id, memberIds });
const project = (teamIds, projectManagerId) => ({ teamIds, projectManagerId });
describe('getAssignableUsers', () => {
    const users = [user('u-1'), user('u-2'), user('u-3'), user('u-pm'), user('u-elsewhere')];
    const teams = [team('t-1', ['u-1', 'u-2']), team('t-2', ['u-3']), team('t-3', ['u-elsewhere'])];
    it('returns members of the project teams plus the project manager', () => {
        const result = getAssignableUsers(users, teams, project(['t-1', 't-2'], 'u-pm'));
        expect(result.map((u) => u.id).sort()).toEqual(['u-1', 'u-2', 'u-3', 'u-pm']);
    });
    it('excludes members of teams the project does not include', () => {
        const result = getAssignableUsers(users, teams, project(['t-1'], 'u-pm'));
        expect(result.map((u) => u.id).sort()).toEqual(['u-1', 'u-2', 'u-pm']);
        expect(result.map((u) => u.id)).not.toContain('u-elsewhere');
    });
    it('returns an empty list when the project is missing', () => {
        expect(getAssignableUsers(users, teams, undefined)).toEqual([]);
        expect(getAssignableUsers(users, teams, null)).toEqual([]);
    });
});
