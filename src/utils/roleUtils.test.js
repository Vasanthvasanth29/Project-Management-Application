import { describe, expect, it } from 'vitest';
import { canManageCustomFields } from './roleUtils';
describe('canManageCustomFields', () => {
    it('allows Admins and Project Managers to manage field definitions', () => {
        expect(canManageCustomFields('ADMIN')).toBe(true);
        expect(canManageCustomFields('PROJECT_MANAGER')).toBe(true);
    });
    it('blocks Team Leaders, Members and anonymous users', () => {
        expect(canManageCustomFields('TEAM_LEADER')).toBe(false);
        expect(canManageCustomFields('MEMBER')).toBe(false);
        expect(canManageCustomFields(undefined)).toBe(false);
    });
    it('covers every declared role exactly', () => {
        const roles = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'MEMBER'];
        const allowed = roles.filter((r) => canManageCustomFields(r));
        expect(allowed).toEqual(['ADMIN', 'PROJECT_MANAGER']);
    });
});
