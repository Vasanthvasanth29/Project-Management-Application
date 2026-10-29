import { describe, it, expect } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { payments, site, memberLimits } from '../../config/siteConfig';
// The SSO store reads `window.location.origin` at module scope, so the node
// test environment needs a location stub before the route tree is imported.
Object.assign(globalThis, { location: { origin: 'http://localhost', pathname: '/' } });
const { AppRoutes } = await import('../../routes');
/**
 * DOM-less smoke tests: render the real route tree to markup inside a
 * MemoryRouter and assert the public FlowExec pages resolve, carry the FlowExec
 * brand, expose the member-count calculator (100–1,000 members) as the
 * authoritative pricing surface, present the Free / Pro / Enterprise discovery
 * tiers without inventing a commercial figure, and keep the gated states
 * (no invented prices / no payment), while the app routes are still matched by
 * the same router configuration.
 */
const renderAt = (path) => renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path], children: h(AppRoutes) }));
describe('public branding', () => {
    it('never renders the legacy brand name on public pages', () => {
        for (const path of ['/', '/pricing', '/checkout', '/contact', '/terms', '/privacy', '/refunds']) {
            expect(renderAt(path)).not.toMatch(/LimberLithe/i);
        }
    });
    it('never renders the unfinished price label on public pages', () => {
        for (const path of ['/', '/pricing', '/checkout']) {
            expect(renderAt(path)).not.toContain('Pending confirmation');
        }
    });
    it('uses FlowExec as the product name', () => {
        const html = renderAt('/');
        expect(site.name).toBe('FlowExec');
        expect(html).toContain('FlowExec');
        expect(html).toContain('Project Management SaaS');
    });
});
describe('landing page', () => {
    it('renders the headline, supporting copy and both CTAs', () => {
        const html = renderAt('/');
        expect(html).toContain('Plan, Track, and Deliver Projects with Confidence.');
        expect(html).toContain('Bring your projects, teams, tasks, and iterations together in one workspace.');
        expect(html).toContain('Get Started');
        expect(html).toContain('Explore Features');
    });
    it('offers the Product, Features, Pricing and Resources navigation', () => {
        const html = renderAt('/');
        expect(html).toContain('Product');
        expect(html).toContain('Features');
        expect(html).toContain('Pricing');
        expect(html).toContain('Resources');
        expect(html).toContain('Log in');
    });
    it('showcases the five verified capability areas', () => {
        const html = renderAt('/');
        expect(html).toContain('Project &amp; work item management');
        expect(html).toContain('Iterations &amp; sprint planning');
        expect(html).toContain('Team collaboration');
        expect(html).toContain('Reports &amp; project progress');
        expect(html).toContain('Role-based access');
        // Large product visual on the hero
        expect(html).toContain('Live Iteration Board');
    });
    it('renders an accessible Plan / Track / Collaborate / Report tab set', () => {
        const html = renderAt('/');
        expect(html).toContain('role="tablist"');
        expect(html).toContain('aria-label="Product capabilities"');
        expect(html).toContain('aria-controls="capability-panel-plan"');
        expect(html).toContain('aria-controls="capability-panel-track"');
        expect(html).toContain('aria-controls="capability-panel-collaborate"');
        expect(html).toContain('aria-controls="capability-panel-report"');
        // One selected tab, four tabs and four panels — every panel stays in the
        // document (hidden) so no content is lost for search or assistive tech.
        expect(html.match(/role="tab"/g)).toHaveLength(4);
        expect(html.match(/role="tabpanel"/g)).toHaveLength(4);
        expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
        expect(html.match(/hidden=""/g)).toHaveLength(3);
    });
    it('showcases roadmap, burndown, capacity and release previews', () => {
        const html = renderAt('/');
        expect(html).toContain('Cross-project roadmap');
        expect(html).toContain('Iteration burndown');
        expect(html).toContain('Team capacity');
        expect(html).toContain('Releases');
        expect(html).toContain('Workflow customization');
    });
    it('includes the member-based pricing calculator with its selector label', () => {
        const html = renderAt('/');
        expect(html).toContain('How many team members do you need?');
        expect(html).toContain('Preview pricing');
        expect(html).toContain('Continue');
        // Default selection: 100 members × preview rate $10 = $1,000 / month
        expect(html).toContain('$1,000');
    });
});
describe('member-based pricing', () => {
    it('estimates the default selection as rate × members and marks it a preview', () => {
        const html = renderAt('/pricing');
        // Default selection: 100 members × preview rate $10 = $1,000 / month
        expect(html).toContain('$1,000');
        expect(html).toContain('Estimated monthly total');
        expect(html).toContain('Preview estimate');
        expect(html).toContain('Preview pricing');
        expect(html).not.toMatch(/LimberLithe/i);
    });
    it('supports 100 to 1,000 members in the calculator controls', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('min="100"');
        expect(html).toContain('max="1000"');
        expect(html).toContain('100 members');
        expect(html).toContain('1,000 members');
        // Quick-select counts offered next to the slider
        expect(memberLimits.min).toBe(100);
        expect(memberLimits.max).toBe(1000);
    });
    it('keeps the member calculator as the authoritative pricing surface', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('How many team members do you need?');
        // The three discovery tiers are present…
        expect(html).toContain('Free');
        expect(html).toContain('Pro');
        expect(html).toContain('Enterprise');
        // …but publish no invented commercial figure: anything the business has
        // not approved renders as a clearly marked placeholder.
        expect(html).toContain('Price to be confirmed');
        expect(html).toContain('Seat limits to be confirmed');
        expect(html).toContain('Preview estimate');
        // Legacy vocabulary from the withdrawn fixed-tier pricing stays gone.
        expect(html).not.toContain('Starter');
        expect(html).not.toContain('Custom quote');
        expect(html).not.toContain('Select a plan');
    });
    it('recalculates from the member count carried in the URL', () => {
        expect(renderAt('/pricing?members=500')).toContain('$5,000');
        expect(renderAt('/pricing?members=1000')).toContain('$10,000');
    });
    it('only offers monthly billing while annual is unapproved', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('Monthly billing.');
        expect(html).toContain('Annual billing will be offered');
        expect(html).not.toContain('Billed annually');
    });
    it('never presents preview figures as approved commercial prices', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('not an approved offer');
        expect(html).not.toContain('Approved price');
        expect(html).not.toContain('Approved rate');
    });
});
describe('checkout', () => {
    it('carries the member count and calculated price into the summary', () => {
        const html = renderAt('/checkout?members=500');
        expect(html).toContain('Order summary');
        expect(html).toContain('500 seats');
        expect(html).toContain('Price per member');
        // Preview rate $10 × 500 members
        expect(html).toContain('$5,000');
        expect(html).toContain('Estimated monthly total');
        expect(html).toContain('Preview estimate');
        expect(html).toContain(payments.notice);
    });
    it('reflects the full supported range in the summary', () => {
        expect(renderAt('/checkout?members=100')).toContain('$1,000');
        expect(renderAt('/checkout?members=100')).toContain('100 seats');
        expect(renderAt('/checkout?members=1000')).toContain('$10,000');
        expect(renderAt('/checkout?members=1000')).toContain('1000 seats');
    });
    it('never resets the selection to a different default or a plan', () => {
        const html = renderAt('/checkout?members=750');
        expect(html).toContain('750 seats');
        expect(html).toContain('$7,500');
        // No plan selector or plan radios anywhere on checkout
        expect(html).not.toContain('Select a plan');
        expect(html).not.toContain('name="plan"');
        expect(html).not.toContain('Custom quote');
    });
    it('clamps out-of-range member counts instead of showing an invalid total', () => {
        expect(renderAt('/checkout?members=50')).toContain('100 seats');
        expect(renderAt('/checkout?members=5000')).toContain('1000 seats');
        // Legacy plan/interval links keep working without reintroducing tiers
        const legacy = renderAt('/checkout?plan=pro&members=500&interval=annual');
        expect(legacy).toContain('500 seats');
        expect(legacy).toContain('$5,000');
        expect(legacy).not.toContain('Billed annually');
    });
    it('defaults to the configured member count when nothing is carried over', () => {
        const html = renderAt('/checkout');
        expect(html).toContain('100 seats');
        expect(html).toContain('$1,000');
    });
    it('keeps checkout disabled until the payment gateway is active', () => {
        const html = renderAt('/checkout?members=500');
        expect(html).toContain('Complete purchase');
        expect(html).toMatch(/<button[^>]*disabled[^>]*>[\s\S]*Complete purchase/);
        // Never collect card details
        expect(html).not.toMatch(/card number|cvv|cvc|expiry/i);
    });
    it('shows monthly billing only while annual is unapproved', () => {
        const html = renderAt('/checkout?members=500&interval=annual');
        expect(html).toContain('Monthly billing.');
        expect(html).not.toContain('Billed annually');
    });
});
describe('legal and contact pages', () => {
    it('renders the legal pages with the draft banner', () => {
        for (const path of ['/terms', '/privacy', '/refunds']) {
            const html = renderAt(path);
            expect(html).toContain('pending business and legal approval');
            expect(html).toContain('Skip to main content');
        }
        expect(renderAt('/terms')).toContain('Terms of Service');
        expect(renderAt('/privacy')).toContain('Privacy Policy');
        expect(renderAt('/refunds')).toContain('Refund &amp; Cancellation Policy');
    });
    it('renders the contact page without inventing contact details', () => {
        const html = renderAt('/contact');
        expect(html).toContain('Contact channels');
        expect(html).toContain('Confirmed sales address pending');
        expect(html).toContain('Contact channels are being confirmed');
        expect(html).not.toMatch(/[a-z0-9._%+-]+@(?!company\.com)[a-z0-9.-]+\.[a-z]{2,}/i);
    });
});
describe('protected routes are preserved', () => {
    it('still redirects signed-out visitors away from app routes', () => {
        // RootRoute renders no app shell for anonymous visitors on protected paths;
        // the router emits a redirect element instead of the dashboard.
        const html = renderAt('/member');
        expect(html).not.toContain('Sign out');
    });
    it('still serves the login page at /login', () => {
        const html = renderAt('/login');
        expect(html).toContain('Back to FlowExec');
    });
});
