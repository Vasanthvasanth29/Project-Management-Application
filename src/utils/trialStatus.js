/** Trial status maths shared by the trial page and the trial workspace. */
import { trial } from '../config/siteConfig';
const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Derive the trial status from its start time. Pure, so the page and the tests
 * share one calculation.
 *
 * @param {string | null} startedAt ISO timestamp the trial started, or null.
 * @param {number} [now] Current time in ms (defaults to Date.now()).
 * @param {number} [durationDays] Trial length in days.
 */
export const getTrialStatus = (startedAt, now = Date.now(), durationDays = trial.durationDays) => {
    const durationMs = durationDays * DAY_MS;
    const start = startedAt ? new Date(startedAt).getTime() : NaN;
    if (!Number.isFinite(start)) {
        return { state: 'not_started', startedAt: null, expiresAt: null, remainingMs: durationMs, durationDays };
    }
    const expires = start + durationMs;
    const remainingMs = Math.max(0, expires - now);
    return {
        state: remainingMs > 0 ? 'active' : 'expired',
        startedAt: new Date(start).toISOString(),
        expiresAt: new Date(expires).toISOString(),
        remainingMs,
        durationDays,
    };
};
/** `remainingMs` → `{ days, hours, minutes }` for the countdown. */
export const splitRemaining = (remainingMs) => {
    const totalMinutes = Math.max(0, Math.floor(remainingMs / 60000));
    return {
        days: Math.floor(totalMinutes / 1440),
        hours: Math.floor((totalMinutes % 1440) / 60),
        minutes: totalMinutes % 60,
    };
};
