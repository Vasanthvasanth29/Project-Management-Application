import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
// The SSO store reads `window.location.origin` at module scope, so the node
// test environment needs a location stub before the route tree is imported.
Object.assign(globalThis, { location: { origin: 'http://localhost', pathname: '/' } });
const { AppRoutes } = await import('../../routes');
const { TrialStatus } = await import('./TrialPage');
const { getTrialStatus } = await import('../../utils/trialStatus');
const renderAt = (path) => renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path], children: h(AppRoutes) }));
/** The whole <a> element carrying `id`, including its label. */
const anchorById = (html, id) => html.match(new RegExp(`<a[^>]*id="${id}"[^>]*>[\\s\\S]*?</a>`))?.[0] ?? '';
const DAY_MS = 24 * 60 * 60 * 1000;
const START = '2026-10-01T09:00:00.000Z';
const startMs = new Date(START).getTime();
const renderStatus = (now) => renderToStaticMarkup(h(MemoryRouter, {
    children: h(TrialStatus, { status: getTrialStatus(START, now), notStartedAction: null }),
}));
describe('homepage trial entry point', () => {
    it('keeps both "Get Started Free" buttons pointing at /register', () => {
        const html = renderAt('/');
        for (const id of ['hero-get-started', 'cta-get-started']) {
            const tag = anchorById(html, id);
            expect(tag).toContain('href="/register"');
            expect(tag).toContain('Get Started Free');
        }
    });
    it('adds a separate "Start 7-Day Limited Trial" link to /trial', () => {
        const tag = anchorById(renderAt('/'), 'home-start-limited-trial');
        expect(tag).toContain('href="/trial"');
        expect(tag).toContain('Start 7-Day Limited Trial');
    });
});
describe('/trial page', () => {
    it('explains the 7-day duration and shows included vs locked features', () => {
        const html = renderAt('/trial');
        expect(html).toContain('7-Day Limited Trial');
        expect(html).toContain('Trial duration');
        expect(html).toContain('Included in the trial');
        expect(html).toContain('Premium — locked during the trial');
        expect(html).toContain('Gantt charts and cross-project roadmaps');
        expect(html).toContain('Not started yet');
        expect(html).toContain('Begin 7-day trial');
    });
    it('never collects payment details', () => {
        const html = renderAt('/trial');
        expect(html).not.toMatch(/card number|cvv|cvc/i);
        // The trial sign-up asks for name, email and password only.
        expect(html.match(/<input[^>]*type="([a-z]+)"/g).map((tag) => tag.match(/type="([a-z]+)"/)[1])).toEqual(['text', 'email', 'password']);
        expect(html).not.toMatch(/payment method|billing address|autocomplete="cc-/i);
    });
});
describe('trial status panel', () => {
    it('shows remaining time, expiry and the sign-in step while active', () => {
        const html = renderStatus(startMs + DAY_MS + 90 * 60000);
        expect(html).toContain('5d 22h 30m');
        expect(html).toContain('Expires on');
        expect(html).toMatch(/Thu 8 Oct 2026/);
        expect(anchorById(html, 'trial-continue')).toContain('href="/trial-workspace"');
    });
    it('shows the ended state after seven days', () => {
        const html = renderStatus(startMs + 8 * DAY_MS);
        expect(html).toContain('Trial ended');
        expect(html).toContain('Expired on');
        expect(anchorById(html, 'trial-continue')).toContain('href="/pricing"');
    });
});
