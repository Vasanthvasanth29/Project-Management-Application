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
 * MemoryRouter and assert the public Limber Lithe pages resolve, carry the
 * Limber Lithe brand, expose the member-count calculator (5–1,000 members) as
 * the authoritative pricing surface, present the Starter / Pro / Enterprise
 * discovery tiers as clearly marked previews without inventing an approved
 * commercial figure, and keep the gated states (no approved prices / no
 * payment), while the app routes are still matched by the same router
 * configuration.
 *
 * The preview rate is $29 per member per month, so every total below is
 * members × 29.
 */
const renderAt = (path) => renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path], children: h(AppRoutes) }));
// The landing-page product showcase mocks a file called "FlowExec_Report_Q3.pdf";
// it is sample content inside a screenshot-style preview, not brand copy.
const withoutSampleContent = (html) => html.replace('FlowExec_Report_Q3.pdf', '');
describe('public branding', () => {
    it('never renders the legacy brand name on public pages', () => {
        for (const path of ['/', '/pricing', '/checkout', '/contact', '/terms', '/privacy', '/refunds']) {
            expect(withoutSampleContent(renderAt(path))).not.toMatch(/FlowExec/i);
        }
    });
    it('never renders the unfinished price label on public pages', () => {
        for (const path of ['/', '/pricing', '/checkout']) {
            expect(renderAt(path)).not.toContain('Pending confirmation');
        }
    });
    it('uses Limber Lithe as the product name', () => {
        const html = renderAt('/');
        expect(site.name).toBe('Limber Lithe');
        expect(html).toContain('Limber Lithe');
        expect(html).toContain('Technologies');
    });
});
describe('landing page', () => {
    it('renders the headline, supporting copy and both CTAs', () => {
        const html = renderAt('/');
        expect(html).toContain('Turn Deadlines');
        expect(html).toContain('Plan sprints, track iteration velocity, and deliver complex roadmaps on time.');
        expect(html).toContain('Get Started');
        expect(html).toContain('Explore Features');
    });
    it('offers the Products, Capabilities, Pricing and Resources navigation', () => {
        const html = renderAt('/');
        expect(html).toContain('Products');
        expect(html).toContain('Capabilities');
        expect(html).toContain('Pricing');
        expect(html).toContain('Resources');
        expect(html).toContain('Log in');
    });
    it('showcases the Plan / Track / Collaborate / Report capability areas', () => {
        const html = renderAt('/');
        for (const area of ['Plan', 'Track', 'Collaborate', 'Report']) {
            expect(html).toContain(`>${area}<`);
        }
        expect(html).toContain('Role-based access');
        // Interactive member-portal showcase below the hero
        expect(html).toContain('Member Portal showcase');
    });
    it('showcases roadmap, burndown, capacity and release previews', () => {
        const html = renderAt('/');
        expect(html).toContain('Cross-Project Roadmaps');
        expect(html).toContain('Sprint Burndown');
        expect(html).toContain('Capacity Allocation');
        expect(html).toContain('Releases');
        expect(html).toContain('Workflow customization');
    });
    it('includes the member-based pricing calculator with its selector label', () => {
        const html = renderAt('/');
        expect(html).toContain('How many team members do you need?');
        expect(html).toContain('Preview pricing');
        expect(html).toContain('Continue');
        // Default selection: 25 members × preview rate $29 = $725 / month
        expect(html).toContain('$725');
    });
});
describe('member-based pricing', () => {
    it('estimates the default selection as rate × members and marks it a preview', () => {
        const html = renderAt('/pricing');
        // Default selection: 25 members × preview rate $29 = $725 / month
        expect(html).toContain('$725');
        expect(html).toContain('Estimated monthly total');
        expect(html).toContain('Preview estimate');
        expect(html).toContain('Preview pricing');
        expect(html).not.toMatch(/FlowExec/i);
    });
    it('supports 5 to 1,000 members in the calculator controls', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('min="5"');
        expect(html).toContain('max="1000"');
        expect(html).toContain('5 members');
        expect(html).toContain('1,000 members');
        // Quick-select counts offered next to the slider
        expect(memberLimits.min).toBe(5);
        expect(memberLimits.max).toBe(1000);
    });
    it('keeps the member calculator as the authoritative pricing surface', () => {
        const html = renderAt('/pricing');
        expect(html).toContain('How many team members do you need?');
        // The three discovery tiers are present…
        expect(html).toContain('Starter');
        expect(html).toContain('Pro');
        expect(html).toContain('Enterprise');
        // …but every figure is a clearly marked preview, and Enterprise is priced
        // by agreement rather than with an invented number.
        expect(html).toContain('Preview estimate');
        expect(html).toContain('Price agreed by contract');
        expect(html).toContain('Contact channels being confirmed');
        // Legacy vocabulary from the withdrawn fixed-tier pricing stays gone.
        expect(html).not.toContain('Custom quote');
        expect(html).not.toContain('Select a plan');
    });
    it('recalculates from the member count carried in the URL', () => {
        expect(renderAt('/pricing?members=500')).toContain('$14,500');
        expect(renderAt('/pricing?members=1000')).toContain('$29,000');
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
        // Preview rate $29 × 500 members
        expect(html).toContain('$14,500');
        expect(html).toContain('Estimated monthly total');
        expect(html).toContain('Preview estimate');
        expect(html).toContain(payments.notice);
    });
    it('reflects the full supported range in the summary', () => {
        expect(renderAt('/checkout?members=5')).toContain('$145');
        expect(renderAt('/checkout?members=5')).toContain('5 seats');
        expect(renderAt('/checkout?members=1000')).toContain('$29,000');
        expect(renderAt('/checkout?members=1000')).toContain('1000 seats');
    });
    it('never resets the selection to a different default or a plan', () => {
        const html = renderAt('/checkout?members=750');
        expect(html).toContain('750 seats');
        expect(html).toContain('$21,750');
        // No plan selector or plan radios anywhere on checkout
        expect(html).not.toContain('Select a plan');
        expect(html).not.toContain('name="plan"');
        expect(html).not.toContain('Custom quote');
    });
    it('clamps out-of-range member counts instead of showing an invalid total', () => {
        expect(renderAt('/checkout?members=3')).toContain('5 seats');
        expect(renderAt('/checkout?members=5000')).toContain('1000 seats');
        // Legacy plan/interval links keep working without reintroducing tiers
        const legacy = renderAt('/checkout?plan=pro&members=500&interval=annual');
        expect(legacy).toContain('500 seats');
        expect(legacy).toContain('$14,500');
        expect(legacy).not.toContain('Billed annually');
    });
    it('defaults to the configured member count when nothing is carried over', () => {
        const html = renderAt('/checkout');
        expect(html).toContain('25 seats');
        expect(html).toContain('$725');
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
        expect(html).toContain('Back to Limber Lithe');
    });
});
