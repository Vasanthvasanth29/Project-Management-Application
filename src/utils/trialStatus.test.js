import { describe, it, expect } from 'vitest';
import { getTrialStatus, splitRemaining } from './trialStatus';
const DAY_MS = 24 * 60 * 60 * 1000;
const START = '2026-10-01T09:00:00.000Z';
const startMs = new Date(START).getTime();
describe('getTrialStatus', () => {
    it('reports a not-started trial with the full 7-day duration', () => {
        const status = getTrialStatus(null, startMs);
        expect(status.state).toBe('not_started');
        expect(status.expiresAt).toBeNull();
        expect(status.durationDays).toBe(7);
        expect(status.remainingMs).toBe(7 * DAY_MS);
    });
    it('expires exactly seven days after the start', () => {
        const status = getTrialStatus(START, startMs + DAY_MS);
        expect(status.state).toBe('active');
        expect(status.expiresAt).toBe('2026-10-08T09:00:00.000Z');
        expect(status.remainingMs).toBe(6 * DAY_MS);
    });
    it('is expired once the seven days have passed and never goes negative', () => {
        expect(getTrialStatus(START, startMs + 7 * DAY_MS).state).toBe('expired');
        const later = getTrialStatus(START, startMs + 30 * DAY_MS);
        expect(later.state).toBe('expired');
        expect(later.remainingMs).toBe(0);
    });
    it('treats an unparseable start time as not started', () => {
        expect(getTrialStatus('not-a-date', startMs).state).toBe('not_started');
    });
});
describe('splitRemaining', () => {
    it('breaks the remaining time into days, hours and minutes', () => {
        expect(splitRemaining(2 * DAY_MS + 3 * 3600000 + 4 * 60000 + 59000)).toEqual({ days: 2, hours: 3, minutes: 4 });
        expect(splitRemaining(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
    });
});
